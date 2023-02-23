import {
  Artifact,
  ArtifactId,
  ClaimedCoords,
  LocationId,
  Planet,
  Player,
  QueuedArrival,
  RevealedCoords,
  VoyageId,
} from '@darkforest_eth/types';
import _ from 'lodash';
import React from 'react';
import { Link } from '../../Frontend/Components/CoreUI';
import { LoadingBarHandle } from '../../Frontend/Components/TextLoadingBar';
import { DarkForestTips } from '../../Frontend/Views/DarkForestTips';
import { TerminalHandle } from '../../Frontend/Views/Terminal';
import { ContractConstants } from '../../_types/darkforest/api/ContractsAPITypes';
import { AddressTwitterMap } from '../../_types/darkforest/api/UtilityServerAPITypes';
import { tryGetAllTwitters } from '../Network/UtilityServerAPI';
import PersistentChunkStore from '../Storage/PersistentChunkStore';
import { ContractsAPI } from './ContractsAPI';

export interface InitialGameState {
  contractConstants: ContractConstants;
  players: Map<string, Player>;
  worldRadius: number;
  allTouchedPlanetIds: LocationId[];
  allRevealedCoords: RevealedCoords[];
  allClaimedCoords?: ClaimedCoords[];
  pendingMoves: QueuedArrival[];
  touchedAndLocatedPlanets: Map<LocationId, Planet>;
  artifactsOnVoyages: Artifact[];
  myArtifacts: Artifact[];
  heldArtifacts: Artifact[][];
  loadedPlanets: LocationId[];
  revealedCoordsMap: Map<LocationId, RevealedCoords>;
  claimedCoordsMap?: Map<LocationId, ClaimedCoords>;
  planetVoyageIdMap: Map<LocationId, VoyageId[]>;
  arrivals: Map<VoyageId, QueuedArrival>;
  twitters: AddressTwitterMap;
  paused: boolean;
}

export class InitialGameStateDownloader {
  private terminal: TerminalHandle;

  public constructor(terminal: TerminalHandle) {
    this.terminal = terminal;
  }

  private makeProgressListener(prettyEntityName: string) {
    const ref = React.createRef<LoadingBarHandle>();
    this.terminal.printLoadingBar(prettyEntityName, ref);
    this.terminal.newline();

    return (percent: number) => {
      ref.current?.setFractionCompleted(percent);
    };
  }

  async download(
    contractsAPI: ContractsAPI,
    persistentChunkStore: PersistentChunkStore
  ): Promise<InitialGameState> {
    const isDev = process.env.NODE_ENV !== 'production';

    /**
     * In development we use the same contract address every time we deploy,
     * so storage is polluted with the IDs of old universes.
     */
    const storedTouchedPlanetIds = isDev
      ? []
      : await persistentChunkStore.getSavedTouchedPlanetIds();
    const storedRevealedCoords = isDev ? [] : await persistentChunkStore.getSavedRevealedCoords();

    this.terminal.printElement(<DarkForestTips tips={tips} />);
    this.terminal.newline();

    const planetIdsLoadingBar = this.makeProgressListener('行星 ID');
    const playersLoadingBar = this.makeProgressListener('玩家');
    const revealedPlanetsLoadingBar = this.makeProgressListener('揭示的行星 ID');
    const revealedPlanetsCoordsLoadingBar = this.makeProgressListener(
      '揭示的行星坐标'
    );

    const pendingMovesLoadingBar = this.makeProgressListener('待定动作');
    const planetsLoadingBar = this.makeProgressListener('行星');
    const artifactsOnPlanetsLoadingBar = this.makeProgressListener('行星上的人工制品');
    const artifactsInFlightLoadingBar = this.makeProgressListener('移动中的工件');
    const yourArtifactsLoadingBar = this.makeProgressListener('你的神器');

    const contractConstants = contractsAPI.getConstants();
    const worldRadius = contractsAPI.getWorldRadius();

    const players = contractsAPI.getPlayers(playersLoadingBar);

    const arrivals: Map<VoyageId, QueuedArrival> = new Map();
    const planetVoyageIdMap: Map<LocationId, VoyageId[]> = new Map();

    const minedChunks = Array.from(await persistentChunkStore.allChunks());
    const minedPlanetIds = new Set(
      _.flatMap(minedChunks, (c) => c.planetLocations).map((l) => l.hash)
    );

    const loadedTouchedPlanetIds = contractsAPI.getTouchedPlanetIds(
      storedTouchedPlanetIds.length,
      planetIdsLoadingBar
    );

    const loadedRevealedCoords = contractsAPI.getRevealedPlanetsCoords(
      storedRevealedCoords.length,
      revealedPlanetsLoadingBar,
      revealedPlanetsCoordsLoadingBar
    );
    const claimedCoordsMap = new Map<LocationId, ClaimedCoords>();

    const allTouchedPlanetIds = storedTouchedPlanetIds.concat(await loadedTouchedPlanetIds);
    const allRevealedCoords = storedRevealedCoords.concat(await loadedRevealedCoords);
    const revealedCoordsMap = new Map<LocationId, RevealedCoords>();
    for (const revealedCoords of allRevealedCoords) {
      revealedCoordsMap.set(revealedCoords.hash, revealedCoords);
    }

    let planetsToLoad = allTouchedPlanetIds.filter(
      (id) => minedPlanetIds.has(id) || revealedCoordsMap.has(id) || claimedCoordsMap.has(id)
    );

    const pendingMoves = await contractsAPI.getAllArrivals(planetsToLoad, pendingMovesLoadingBar);

    // add origin points of voyages to known planets, because we need to know origin owner to render
    // the shrinking / incoming circle
    for (const arrival of pendingMoves) {
      planetsToLoad.push(arrival.fromPlanet);
    }
    planetsToLoad = [...new Set(planetsToLoad)];

    const touchedAndLocatedPlanets = await contractsAPI.bulkGetPlanets(
      planetsToLoad,
      planetsLoadingBar
    );

    touchedAndLocatedPlanets.forEach((_planet, locId) => {
      if (touchedAndLocatedPlanets.has(locId)) {
        planetVoyageIdMap.set(locId, []);
      }
    });

    for (const arrival of pendingMoves) {
      const voyageIds = planetVoyageIdMap.get(arrival.toPlanet);
      if (voyageIds) {
        voyageIds.push(arrival.eventId);
        planetVoyageIdMap.set(arrival.toPlanet, voyageIds);
      }
      arrivals.set(arrival.eventId, arrival);
    }

    const artifactIdsOnVoyages: ArtifactId[] = [];
    for (const arrival of pendingMoves) {
      if (arrival.artifactId) {
        artifactIdsOnVoyages.push(arrival.artifactId);
      }
    }

    const artifactsOnVoyages = await contractsAPI.bulkGetArtifacts(
      artifactIdsOnVoyages,
      artifactsInFlightLoadingBar
    );

    const heldArtifacts = contractsAPI.bulkGetArtifactsOnPlanets(
      planetsToLoad,
      artifactsOnPlanetsLoadingBar
    );
    const myArtifacts = contractsAPI.getPlayerArtifacts(
      contractsAPI.getAddress(),
      yourArtifactsLoadingBar
    );

    const twitters = await tryGetAllTwitters();
    const paused = contractsAPI.getIsPaused();

    const initialState: InitialGameState = {
      contractConstants: await contractConstants,
      players: await players,
      worldRadius: await worldRadius,
      allTouchedPlanetIds,
      allRevealedCoords,
      pendingMoves,
      touchedAndLocatedPlanets,
      artifactsOnVoyages,
      myArtifacts: await myArtifacts,
      heldArtifacts: await heldArtifacts,
      loadedPlanets: planetsToLoad,
      revealedCoordsMap,
      claimedCoordsMap,
      planetVoyageIdMap,
      arrivals,
      twitters,
      paused: await paused,
    };

    return initialState;
  }
}

const tips = [
  '小心海盗！要占领一个有海盗的星球，只需发送一次足够大的攻击来克服其当前的能量。',
  <>
    与盟友（和敌人）一起穿越黑暗森林 -加入{' '}
    <Link to='https://discord.gg/C23An5qNGv'>黑暗森林不和谐</Link>!
  </>,
  '有许多不同的神器类型，每一种都有独特的属性......尝试在一个星球上激活一个！',
  '前 63 名玩家在每个 v0.6 回合结束时获得 NFT 奖励！',
  "有许多不同的方式来享受黑暗森林——只要你玩得开心，你就做对了。",
  '捕获行星时要小心 -如果您攻击玩家拥有的行星，它可能看起来像战争行为！',
  '一颗行星最多可以有一个活动神器。',
  '撤回神器（通过时空撕裂）让您可以完全控制该神器作为 ERC 721 令牌。您可以通过 Spacetime Rips 将您撤回的文物存放回宇宙。',
  '您可以使用插件通过自动执行重复性任务来增强您的能力。顶级玩家可能正在使用插件 (:',
  '类星体可以储存大量的能量和银，但代价是两者都不能产生。',
  '永远不要与任何人分享您的私钥！',
  '广播一颗行星会向所有其他玩家揭示它的位置！',
  '您可以花费银币来升级您的星球。',
  '星云中的行星比深空中的行星更难捕捉。',
  '宇宙的某些部分已损坏，并包含特殊版本的人工制品。',
  '您可以导入和导出地图！从别人那里导入地图要小心，它们可能包含伪造的地图数据。',
  <>
    如果在您的计算机上挖掘 Universe 速度很慢，您可以尝试 Remote Miner 插件。发现
    和其他插件 <Link to='https://plugins.zkga.me'>plugins.zkga.me</Link>.
  </>,
  "在任何给定时间，一个星球上只能有 6 个神器。如果幸运的话，有时会更多。毕竟是区块链。",
  '在尝试寻找神器之前，必须勘探铸造厂，但请确保在 256 个方块之前单击“查找”，否则它将永远丢失。',
  '防御升级使您的行星不易受到攻击，范围升级使您的航程更远且衰减更少，而速度升级使您的航程更快。',
  '虫洞人工制品减少了 2 个行星之间的有效距离。尝试使用它们连接相距很远的 2 个行星！',
  '停用后，某些神器必须冷却一段时间才能再次激活。',
  'Photoid Cannon 人工制品会在您的星球激活时减益，但在充电期之后从星球出发的第一次航行会获得巨大的统计提升。 Photoid Cannon 工件在使用时会被销毁。',
  "Planetary Shield artifacts 将极大地增强行星的防御，但以能量和能量增长统计数据为代价。行星护盾神器在停用时被摧毁。",
  "Bloom Filter 工件会立即将行星的能量和银子设置为满，但在激活时会被摧毁。尝试在 Quasar 上使用它们！",
  '黑暗森林存在于区块链上，因此您可以根据需要与完全不同的客户端一起玩。',
  <>
    写插件？查看一些文档{' '}
    <Link to='https://github.com/darkforest-eth/client/blob/master/docs/classes/Backend_GameLogic_GameManager.default.md'>
      这个
    </Link>{' '}
    还有{' '}
    <Link to='https://github.com/darkforest-eth/client/blob/master/docs/classes/Backend_GameLogic_GameUIManager.default.md'>
      还有这个
    </Link>
    .
  </>,
];
