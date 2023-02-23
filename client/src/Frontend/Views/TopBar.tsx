import { Monomitter } from '@darkforest_eth/events';
import { weiToEth } from '@darkforest_eth/network';
import { EthAddress, ModalName, TooltipName } from '@darkforest_eth/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { CaptureZonesGeneratedEvent } from '../../Backend/GameLogic/CaptureZoneGenerator';
import { Hook } from '../../_types/global/GlobalTypes';
import { AlignCenterHorizontally } from '../Components/CoreUI';
import { AccountLabel } from '../Components/Labels/Labels';
import { Gold, Red, Sub, Text, White } from '../Components/Text';
import { TooltipTrigger } from '../Panes/Tooltip';
import { usePlayer, useUIManager } from '../Utils/AppHooks';
import { DFZIndex } from '../Utils/constants';
import { useEmitterSubscribe, useEmitterValue } from '../Utils/EmitterHooks';
import { ModalToggleButton } from './ModalIcon';
import { NetworkHealth } from './NetworkHealth';
import { Paused } from './Paused';

const TopBarContainer = styled.div`
  z-index: ${DFZIndex.MenuBar};
  padding: 0 2px;
  width: 530px;
`;

const Numbers = styled.div`
  display: inline-block;
`;

function BoardPlacement({ account }: { account: EthAddress | undefined }) {
  const uiManager = useUIManager();
  const player = usePlayer(uiManager, account);

  let content;

  if (!player.value) {
    content = <Sub>n/a</Sub>;
  } else {
    let formattedScore = 'n/a';
    if (player.value.score !== undefined && player.value.score !== null) {
      formattedScore = player.value.score.toLocaleString();
    }

    content = (
      <Sub>
        <TooltipTrigger name={TooltipName.Score}>
          分数: <Text>{formattedScore}</Text>
        </TooltipTrigger>
      </Sub>
    );
  }

  return <Numbers>{content}</Numbers>;
}

function SpaceJunk({ account }: { account: EthAddress | undefined }) {
  const uiManager = useUIManager();

  const [spaceJunk, setSpaceJunk] = useState<number>(0);
  const [spaceJunkLimit, setSpaceJunkLimit] = useState<number>(0);

  useEffect(() => {
    if (!uiManager) return;
    const gameManager = uiManager.getGameManager();

    const refreshSpaceJunk = () => {
      if (!account) return;

      setSpaceJunk(gameManager.getPlayerSpaceJunk(account) || 0);
      setSpaceJunkLimit(gameManager.getPlayerSpaceJunkLimit(account) || 0);
    };

    const sub = gameManager.playersUpdated$.subscribe(() => {
      refreshSpaceJunk();
    });
    refreshSpaceJunk();

    return () => sub.unsubscribe();
  }, [uiManager, account]);

  return (
    <Numbers>
      <Sub>
        <TooltipTrigger name={TooltipName.SpaceJunk}>
          宇宙垃圾：{' '}
          <Text>
            {spaceJunk} / {spaceJunkLimit}
          </Text>
        </TooltipTrigger>
      </Sub>
    </Numbers>
  );
}

function CaptureZoneExplanation() {
  const uiManager = useUIManager();

  const numberedItem = (n: number, content: string) => (
    <li>
      <White>{n}.)</White> {content}
    </li>
  );

  return (
    <>
      <White>捕获区:</White> 能量波动正在创造非常有价值的空间区域。{' '}
      <Gold>
        在这些区域入侵和控制行星会给你分数！这些区域标记为金色
        环在你的地图上。
      </Gold>
      <br />
      <br />
      为了在一个区域中捕获一颗行星，您必须：
      <ol>
        {numberedItem(1, '在捕获区拥有一颗行星。')}
        {numberedItem(2, '单击“入侵”按钮开始入侵。')}
        {numberedItem(
          3,
          `持有这个星球 ${uiManager.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED}
          区块.`
        )}
        {numberedItem(
          4,
          '单击捕获按钮捕获行星（捕获不需要您在该区域中，只需要入侵）.'
        )}
      </ol>
      <br />
      <Red>
        行星只能被捕获一次。然而，在入侵开始后，任何人都可以
        抓住它.
      </Red>{' '}
      如果您看到对手开始入侵，您可以从他们手中夺取星球并占领它
      为自己！
    </>
  );
}

function CaptureZones({
  emitter,
  nextChangeBlock,
}: {
  emitter: Monomitter<CaptureZonesGeneratedEvent>;
  nextChangeBlock: number;
}) {
  const uiManager = useUIManager();
  const currentBlockNumber = useEmitterValue(uiManager.getEthConnection().blockNumber$, undefined);
  const [nextGenerationBlock, setNextGenerationBlock] = useState(
    Math.max(
      uiManager.contractConstants.GAME_START_BLOCK +
        uiManager.contractConstants.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL,
      nextChangeBlock
    )
  );

  useEmitterSubscribe(
    emitter,
    (zoneGeneration) => {
      setNextGenerationBlock(zoneGeneration.nextChangeBlock);
    },
    [setNextGenerationBlock]
  );

  return (
    <Numbers>
      <TooltipTrigger name={TooltipName.Empty} extraContent={<CaptureZoneExplanation />}>
        捕获区变化 {nextGenerationBlock - (currentBlockNumber || 0)} 区块.
      </TooltipTrigger>
    </Numbers>
  );
}

export function TopBar({ twitterVerifyHook }: { twitterVerifyHook: Hook<boolean> }) {
  const uiManager = useUIManager();
  const player = usePlayer(uiManager);
  const account = player.value?.address;
  const twitter = player.value?.twitter;
  const balance = useEmitterValue(uiManager.getMyBalance$(), uiManager.getMyBalanceBn());

  let captureZones = null;
  if (uiManager.captureZonesEnabled) {
    const captureZoneGenerator = uiManager.getCaptureZoneGenerator();
    if (captureZoneGenerator) {
      const emitter = captureZoneGenerator.generated$;
      const nextChangeBlock = captureZoneGenerator.getNextChangeBlock();
      captureZones = <CaptureZones emitter={emitter} nextChangeBlock={nextChangeBlock} />;
    }
  }

  return (
    <TopBarContainer>
      <AlignCenterHorizontally style={{ width: '100%', justifyContent: 'space-around' }}>
        <TooltipTrigger
          name={TooltipName.Empty}
          extraContent={<Text>您的 Burner 钱包地址。</Text>}
        >
          <AccountLabel includeAddressIfHasTwitter={true} width={'50px'} />
        </TooltipTrigger>
        <TooltipTrigger
          name={TooltipName.Empty}
          extraContent={<Text>您的一次性钱包余额。</Text>}
        >
          <Sub>({weiToEth(balance).toFixed(2)} xDAI)</Sub>
        </TooltipTrigger>
        {process.env.DF_WEBSERVER_URL && (
          <>
            <TooltipTrigger
              name={TooltipName.Empty}
              extraContent={<Text>将您的 Burner 钱包连接到您的 Twitter 帐户。</Text>}
            >
              <ModalToggleButton
                size='small'
                modal={ModalName.TwitterVerify}
                hook={twitterVerifyHook}
                style={
                  {
                    width: !twitter ? '100px' : undefined,
                  } as CSSStyleDeclaration & React.CSSProperties
                }
                text={!twitter ? 'Connect' : undefined}
              />
            </TooltipTrigger>
          </>
        )}
        <BoardPlacement account={account} />
      </AlignCenterHorizontally>
      <AlignCenterHorizontally style={{ justifyContent: 'space-around', width: '100%' }}>
        {captureZones}
        {uiManager.getSpaceJunkEnabled() && (
          <>
            <SpaceJunk account={account} />
          </>
        )}
      </AlignCenterHorizontally>
      <NetworkHealth />
      <Paused />
    </TopBarContainer>
  );
}
