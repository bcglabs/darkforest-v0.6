import { isUnconfirmedRevealTx } from '@darkforest_eth/serde';
import { EthAddress, LocationId } from '@darkforest_eth/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Btn } from '../Components/Btn';
import { CenterBackgroundSubtext, Spacer } from '../Components/CoreUI';
import { LoadingSpinner } from '../Components/LoadingSpinner';
import { Blue, White } from '../Components/Text';
import { formatDuration, TimeUntil } from '../Components/TimeUntil';
import dfstyles from '../Styles/dfstyles';
import { usePlanet, useUIManager } from '../Utils/AppHooks';
import { useEmitterValue } from '../Utils/EmitterHooks';
import { ModalHandle } from '../Views/ModalPane';

const BroadcastWrapper = styled.div`
  & .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    & > span {
      &:first-child {
        color: ${dfstyles.colors.subtext};
        padding-right: 1em;
      }
    }
  }
  & .message {
    margin: 1em 0;

    & p {
      margin: 0.5em 0;

      &:last-child {
        margin-bottom: 1em;
      }
    }
  }
`;

export function BroadcastPaneHelpContent() {
  return (
    <div>
      向链上的所有其他玩家揭示这个星球的位置！
      <Spacer height={8} />
      广播可能是一种有效的进攻策略！揭示强大敌人的位置，也许
      别人会替你照顾他们吗？
    </div>
  );
}

export function BroadcastPane({
  initialPlanetId,
  modal: _modal,
}: {
  modal: ModalHandle;
  initialPlanetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const planetId = useEmitterValue(uiManager.selectedPlanetId$, initialPlanetId);
  const planet = usePlanet(uiManager, planetId).value;

  const getLoc = () => {
    if (!planet || !uiManager) return { x: 0, y: 0 };
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) return { x: 0, y: 0 };
    return loc.coords;
  };

  const broadcast = () => {
    if (!planet || !uiManager) return;
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) return;

    uiManager.revealLocation(loc.hash);
  };

  const [account, setAccount] = useState<EthAddress | undefined>(undefined); // consider moving this one to parent
  const isRevealed = planet?.coordsRevealed;
  const broadcastCooldownPassed = uiManager.getNextBroadcastAvailableTimestamp() <= Date.now();
  const currentlyBroadcastingAnyPlanet = uiManager.isCurrentlyRevealing();

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  let revealBtn = undefined;

  if (isRevealed) {
    revealBtn = <Btn disabled={true}>广播坐标</Btn>;
  } else if (planet?.transactions?.hasTransaction(isUnconfirmedRevealTx)) {
    revealBtn = (
      <Btn disabled={true}>
        <LoadingSpinner initialText={'广播...'} />
      </Btn>
    );
  } else if (!broadcastCooldownPassed) {
    revealBtn = <Btn disabled={true}>广播坐标</Btn>;
  } else {
    revealBtn = (
      <Btn disabled={currentlyBroadcastingAnyPlanet} onClick={broadcast}>
        广播坐标
      </Btn>
    );
  }

  const warningsSection = (
    <div>
      {currentlyBroadcastingAnyPlanet && (
        <p>
          <Blue>信息:</Blue> 揭示...
        </p>
      )}
      {planet?.owner === account && (
        <p>
          <Blue>信息:</Blue> 你拥有这个星球！透露其位置是一种危险的做法。
        </p>
      )}
      {isRevealed && (
        <p>
          <Blue>信息:</Blue> 这个星球的位置已经被揭露，不能被揭露
          再次！
        </p>
      )}
      {!broadcastCooldownPassed && (
        <p>
          <Blue>信息:</Blue> 你必须等着{' '}
          <TimeUntil timestamp={uiManager.getNextBroadcastAvailableTimestamp()} ifPassed={'now!'} />{' '}
          揭示另一个星球。
        </p>
      )}
    </div>
  );

  if (planet) {
    return (
      <BroadcastWrapper>
        <div>
          您可以广播一颗行星以在地图上公开显示它的位置。你只能
          广播一次行星的位置{' '}
          <White>
            {formatDuration(uiManager.contractConstants.LOCATION_REVEAL_COOLDOWN * 1000)}
          </White>
          .
        </div>
        <div className='message'>{warningsSection}</div>
        <div className='row'>
          <span>坐标</span>
          <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
        </div>
        <Spacer height={8} />
        <p style={{ textAlign: 'right' }}>{revealBtn}</p>
      </BroadcastWrapper>
    );
  } else {
    return (
      <CenterBackgroundSubtext width='100%' height='75px'>
        选择一个星球
      </CenterBackgroundSubtext>
    );
  }
}
