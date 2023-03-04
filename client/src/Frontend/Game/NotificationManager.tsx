import { biomeName, isLocatable } from '@darkforest_eth/gamelogic';
import {
  Artifact,
  Biome,
  Chunk,
  ContractMethodName,
  EthTxStatus,
  LocatablePlanet,
  Planet,
  TxIntent,
} from '@darkforest_eth/types';
import EventEmitter from 'events';
import { startCase } from 'lodash';
import React from 'react';
import { getRandomActionId } from '../../Backend/Utils/Utils';
import {
  ArtifactFound,
  ArtifactProspected,
  FoundCorrupted,
  FoundDeadSpace,
  FoundDeepSpace,
  FoundDesert,
  FoundForest,
  FoundGrassland,
  FoundIce,
  FoundLava,
  FoundOcean,
  FoundPirates,
  FoundRuins,
  FoundSilver,
  FoundSpace,
  FoundSwamp,
  FoundTradingPost,
  FoundTundra,
  FoundWasteland,
  Generic,
  PlanetAttacked,
  PlanetConquered,
  PlanetLost,
  Quasar,
  TxDeclined,
} from '../Components/Icons';
import {
  ArtifactBiomeText,
  ArtifactRarityLabelAnim,
  ArtifactTypeText,
} from '../Components/Labels/ArtifactLabels';
import { ArtifactNameLink, CenterChunkLink, FAQ04Link, PlanetNameLink } from '../Components/Text';

export const enum NotificationType {
  Tx,
  CanUpgrade,
  BalanceEmpty,
  WelcomePlayer,
  FoundSpace,
  FoundDeepSpace,
  FoundDeadSpace,
  FoundPirates,
  FoundSilver,
  FoundSilverBank,
  FoundTradingPost,
  FoundComet,
  FoundFoundry,
  FoundBiome,
  FoundBiomeOcean,
  FoundBiomeForest,
  FoundBiomeGrassland,
  FoundBiomeTundra,
  FoundBiomeSwamp,
  FoundBiomeDesert,
  FoundBiomeIce,
  FoundBiomeWasteland,
  FoundBiomeLava,
  FoundBiomeCorrupted,
  PlanetLost,
  PlanetWon,
  PlanetAttacked,
  ArtifactProspected,
  ArtifactFound,
  ReceivedPlanet,
  Generic,
  TxInitError,
}

const BiomeNotificationMap = {
  [Biome.OCEAN]: NotificationType.FoundBiomeOcean,
  [Biome.FOREST]: NotificationType.FoundBiomeForest,
  [Biome.GRASSLAND]: NotificationType.FoundBiomeGrassland,
  [Biome.TUNDRA]: NotificationType.FoundBiomeTundra,
  [Biome.SWAMP]: NotificationType.FoundBiomeSwamp,
  [Biome.DESERT]: NotificationType.FoundBiomeDesert,
  [Biome.ICE]: NotificationType.FoundBiomeIce,
  [Biome.WASTELAND]: NotificationType.FoundBiomeWasteland,
  [Biome.LAVA]: NotificationType.FoundBiomeLava,
  [Biome.CORRUPTED]: NotificationType.FoundBiomeCorrupted,
};
function getNotificationTypeFromPlanetBiome(biome: Biome): NotificationType {
  if (!biome) throw new Error('Biome is a required to get a NotificationType');
  return BiomeNotificationMap[biome];
}

export type NotificationInfo = {
  type: NotificationType;
  message: React.ReactNode;
  icon: React.ReactNode;
  id: string;
  color?: string;
  txData?: TxIntent;
  txStatus?: EthTxStatus;
};

export const enum NotificationManagerEvent {
  Notify = 'Notify',
  ClearNotification = 'ClearNotification',
}

class NotificationManager extends EventEmitter {
  static instance: NotificationManager;

  private constructor() {
    super();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }

    return NotificationManager.instance;
  }

  private getIcon(type: NotificationType) {
    switch (type) {
      case NotificationType.TxInitError:
        return <TxDeclined height={'48px'} width={'48px'} />;
      case NotificationType.FoundSilverBank:
        return <Quasar height={'48px'} width={'48px'} />;
        break;
      case NotificationType.FoundSpace:
        return <FoundSpace height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundDeepSpace:
        return <FoundDeepSpace height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundDeadSpace:
        return <FoundDeadSpace height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundPirates:
        return <FoundPirates height={'48px'} width={'48px'} />;
        break;
      case NotificationType.FoundSilver:
        return <FoundSilver height={'48px'} width={'48px'} />;
        break;
      case NotificationType.FoundTradingPost:
        return <FoundTradingPost height={'48px'} width={'48px'} />;
        break;

      case NotificationType.FoundFoundry:
        return <FoundRuins height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeOcean:
        return <FoundOcean height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeForest:
        return <FoundForest height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeGrassland:
        return <FoundGrassland height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeTundra:
        return <FoundTundra height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeSwamp:
        return <FoundSwamp height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeDesert:
        return <FoundDesert height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeIce:
        return <FoundIce height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeWasteland:
        return <FoundWasteland height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeLava:
        return <FoundLava height={'64px'} width={'64px'} />;
        break;
      case NotificationType.FoundBiomeCorrupted:
        return <FoundCorrupted height={'64px'} width={'64px'} />;
        break;
      case NotificationType.PlanetAttacked:
        return <PlanetAttacked height={'48px'} width={'48px'} />;
        break;
      case NotificationType.PlanetLost:
        return <PlanetLost height={'48px'} width={'48px'} />;
        break;
      case NotificationType.PlanetWon:
        return <PlanetConquered height={'48px'} width={'48px'} />;
        break;
      case NotificationType.ArtifactProspected:
        return <ArtifactProspected height={'48px'} width={'48px'} />;
        break;
      case NotificationType.ArtifactFound:
        return <ArtifactFound height={'48px'} width={'48px'} />;
      default:
        return <Generic height={'48px'} width={'48px'} />;
        break;
    }
  }

  reallyLongNotification() {
    let message = '';

    for (let i = 0; i < 100; i++) {
      message += 'lol ';
    }

    this.emit(NotificationManagerEvent.Notify, {
      type: NotificationType.Generic,
      message,
      id: getRandomActionId(),
      icon: this.getIcon(NotificationType.Generic),
    });
  }

  clearNotification(id: string) {
    this.emit(NotificationManagerEvent.ClearNotification, id);
  }

  notify(type: NotificationType, message: React.ReactNode): void {
    this.emit(NotificationManagerEvent.Notify, {
      type,
      message,
      id: getRandomActionId(),
      icon: this.getIcon(type),
    });
  }

  welcomePlayer(): void {
    this.notify(
      NotificationType.WelcomePlayer,
      <span>
        欢迎来到黑暗森林世界！这些是您的通知。
        <br />
        单击通知以将其关闭。
      </span>
    );
  }

  foundSpace(chunk: Chunk): void {
    this.notify(
      NotificationType.FoundSpace,
      <span>
        恭喜！你找到了空间！太空拥有比其他地方更宝贵的资源 <br />
        你的母星所在的星云.{' '}
        <CenterChunkLink chunk={chunk}>Click to view</CenterChunkLink>.
      </span>
    );
  }

  foundDeepSpace(chunk: Chunk): void {
    this.notify(
      NotificationType.FoundDeepSpace,
      <span>
        恭喜！你发现了深空！深空有更多稀有 <br />
        行星，但是深空的所有行星都降低了防御！{' '}
        <CenterChunkLink chunk={chunk}>点击查看</CenterChunkLink>.
      </span>
    );
  }

  foundDeadSpace(chunk: Chunk): void {
    this.notify(
      NotificationType.FoundDeadSpace,
      <span>
        恭喜！你发现了死亡空间！死亡空间是最有价值的 <br />
        以及宇宙中最危险的部分，腐败的行星所在的地方......{' '}
        <CenterChunkLink chunk={chunk}>Click to view</CenterChunkLink>.
      </span>
    );
  }

  foundSilver(planet: Planet): void {
    this.notify(
      NotificationType.FoundSilver,
      <span>
        你发现了一个银矿！银可用于升级行星。 <br />
        点击查看 <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundSilverBank(planet: Planet): void {
    this.notify(
      NotificationType.FoundSilverBank,
      <span>
        你发现了一个类星体！类星体很弱，但可以容纳大量的银子。 <br />
        点击查看 <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundTradingPost(planet: Planet): void {
    this.notify(
      NotificationType.FoundTradingPost,
      <span>
        你发现了一个时空裂缝！现在您可以将工件移入和移出 Universe。点击
        看法 <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundPirates(planet: Planet): void {
    this.notify(
      NotificationType.FoundPirates,
      <span>
        你找到了太空海盗！必须先打败未被征服的行星.
        <br />
        点击查看 <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundComet(planet: Planet): void {
    this.notify(
      NotificationType.FoundComet,
      <span>
        你发现了一颗彗星！有彗星的行星有双倍的统计数据！ <br />
        点击查看 <PlanetNameLink planet={planet} />
      </span>
    );
  }

  foundBiome(planet: LocatablePlanet): void {
    this.notify(
      getNotificationTypeFromPlanetBiome(planet.biome),
      <span>
        你发现了 {biomeName(planet.biome)} 生物群系! <br />
        点击查看 <PlanetNameLink planet={planet} />
      </span>
    );
  }

  foundFoundry(planet: LocatablePlanet): void {
    this.notify(
      NotificationType.FoundFoundry,
      <span>
        你找到了一个可以生产神器的星球！神器可以用来增强你的能力
        行星和动作！ <br />
        点击查看 <PlanetNameLink planet={planet} />
      </span>
    );
  }
  artifactProspected(planet: LocatablePlanet): void {
    this.notify(
      NotificationType.ArtifactProspected,
      <span>
        你找了一家铸造厂！ <br />
        上面有什么文物等待被发现？点击查看{' '}
        <PlanetNameLink planet={planet} />
      </span>
    );
  }

  artifactFound(planet: LocatablePlanet, artifact: Artifact): void {
    this.notify(
      NotificationType.ArtifactFound,
      <span>
        你找到了 <ArtifactNameLink id={artifact.id} />, a{' '}
        <ArtifactRarityLabelAnim rarity={artifact.rarity} />{' '}
        <ArtifactBiomeText artifact={artifact} /> <ArtifactTypeText artifact={artifact} />
        {'!'.repeat(artifact.rarity)} <br />
        点击查看 <PlanetNameLink planet={planet} />
      </span>
    );
  }
  planetConquered(planet: LocatablePlanet): void {
    this.notify(
      NotificationType.PlanetWon,
      <span>
        你征服了 <PlanetNameLink planet={planet}></PlanetNameLink>, 你势不可挡！
      </span>
    );
  }
  planetLost(planet: LocatablePlanet): void {
    this.notify(
      NotificationType.PlanetLost,
      <span>
        你输了 <PlanetNameLink planet={planet}></PlanetNameLink>, 不好了！
      </span>
    );
  }
  planetAttacked(planet: LocatablePlanet): void {
    this.notify(
      NotificationType.PlanetAttacked,
      <span>
        你的星球 <PlanetNameLink planet={planet}></PlanetNameLink> 被攻击了！
      </span>
    );
  }

  planetCanUpgrade(planet: Planet): void {
    this.notify(
      NotificationType.CanUpgrade,
      <span>
        你的星球 <PlanetNameLink planet={planet} /> 可以升级！ <br />
      </span>
    );
  }

  balanceEmpty(): void {
    this.notify(
      NotificationType.BalanceEmpty,
      <span>
        你的 xDAI 账户余额不足!
        <br />
        点击 <FAQ04Link>here</FAQ04Link> 学习如何获得更多.
      </span>
    );
  }

  receivedPlanet(planet: Planet) {
    this.notify(
      NotificationType.ReceivedPlanet,
      <span>
        有人刚给你发了他们的星球: <PlanetNameLink planet={planet} />.{' '}
        {!isLocatable(planet) && "您需要向发送它的人询问它的位置。"}
      </span>
    );
  }

  txInitError(methodName: ContractMethodName, failureReason: string) {
    this.notify(
      NotificationType.TxInitError,
      <span>
        {startCase(methodName)} 失败的. 原因: {failureReason}
      </span>
    );
  }
}

export default NotificationManager;
