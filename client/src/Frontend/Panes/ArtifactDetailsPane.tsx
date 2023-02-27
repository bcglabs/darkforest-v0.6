import { EMPTY_ADDRESS } from '@darkforest_eth/constants';
import { dateMintedAt, hasStatBoost, isActivated, isSpaceShip } from '@darkforest_eth/gamelogic';
import { artifactName, getPlanetName, getPlanetNameHash } from '@darkforest_eth/procedural';
import {
  Artifact,
  ArtifactId,
  ArtifactRarityNames,
  ArtifactType,
  EthAddress,
  LocationId,
  TooltipName,
  Upgrade,
} from '@darkforest_eth/types';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { getUpgradeStat } from '../../Backend/Utils/Utils';
import { ContractConstants } from '../../_types/darkforest/api/ContractsAPITypes';
import { StatIdx } from '../../_types/global/GlobalTypes';
import { ArtifactImage } from '../Components/ArtifactImage';
import { Spacer } from '../Components/CoreUI';
import { StatIcon } from '../Components/Icons';
import { ArtifactRarityLabelAnim, ArtifactTypeText } from '../Components/Labels/ArtifactLabels';
import { ArtifactBiomeLabelAnim } from '../Components/Labels/BiomeLabels';
import { AccountLabel } from '../Components/Labels/Labels';
import { ReadMore } from '../Components/ReadMore';
import { Green, Red, Sub, Text, White } from '../Components/Text';
import { TextPreview } from '../Components/TextPreview';
import { TimeUntil } from '../Components/TimeUntil';
import dfstyles from '../Styles/dfstyles';
import { useArtifact, useUIManager } from '../Utils/AppHooks';
import { ModalHandle } from '../Views/ModalPane';
import { ArtifactActions } from './ManagePlanetArtifacts/ArtifactActions';
import { TooltipTrigger } from './Tooltip';

const StatsContainer = styled.div`
  flex-grow: 1;
`;

const ArtifactDetailsHeader = styled.div`
  min-height: 128px;
  display: flex;
  flex-direction: row;

  & > div::last-child {
    flex-grow: 1;
  }

  .statrow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    & > span:first-child {
      margin-right: 1.5em;
    }

    & > span:last-child {
      text-align: right;
      width: 6em;
      flex-grow: 1;
    }
  }
`;

export function UpgradeStatInfo({
  upgrades,
  stat,
}: {
  upgrades: (Upgrade | undefined)[];
  stat: StatIdx;
}) {
  let mult = 100;

  for (const upgrade of upgrades) {
    if (upgrade) {
      mult *= getUpgradeStat(upgrade, stat) / 100;
    }
  }

  const statName = [
    TooltipName.Energy,
    TooltipName.EnergyGrowth,
    TooltipName.Range,
    TooltipName.Speed,
    TooltipName.Defense,
  ][stat];

  return (
    <div className='statrow'>
      <TooltipTrigger name={statName}>
        <StatIcon stat={stat} />
      </TooltipTrigger>
      <span>
        {mult > 100 && <Green>+{Math.round(mult - 100)}%</Green>}
        {mult === 100 && <Sub>no effect</Sub>}
        {mult < 100 && <Red>-{Math.round(100 - mult)}%</Red>}
      </span>
    </div>
  );
}

const StyledArtifactDetailsBody = styled.div`
  & > div:first-child p {
    text-decoration: underline;
  }

  & .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > span:first-child {
      color: ${dfstyles.colors.subtext};
    }

    & > span:last-child {
      text-align: right;
    }
  }

  & .link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
`;

const ArtifactName = styled.div`
  color: ${dfstyles.colors.text};
  font-weight: bold;
`;

const ArtifactNameSubtitle = styled.div`
  color: ${dfstyles.colors.subtext};
  margin-bottom: 8px;
`;

export function ArtifactDetailsHelpContent() {
  return (
    <div>
      <p>
       在此窗格中，您可以查看有关特定工件的特定信息。你也可以
        发起与神器的对话！尝试与您的人工制品交谈。做点新的
        朋友们(^:
      </p>
    </div>
  );
}

export function ArtifactDetailsBody({
  artifactId,
  contractConstants,
  depositOn,
  noActions,
}: {
  artifactId: ArtifactId;
  contractConstants: ContractConstants;
  modal?: ModalHandle;
  depositOn?: LocationId;
  noActions?: boolean;
}) {
  const uiManager = useUIManager();
  const artifactWrapper = useArtifact(uiManager, artifactId);
  const artifact = artifactWrapper.value;

  if (!artifact) {
    return null;
  }

  const account = (addr: EthAddress) => {
    const twitter = uiManager?.getTwitter(addr);
    if (twitter) {
      return '@' + twitter;
    }
    return <TextPreview text={addr} />;
  };

  const owner = () => {
    if (!artifact) return '';
    return account(artifact.currentOwner);
  };

  const discoverer = () => {
    if (!artifact) return '';
    return account(artifact.discoverer);
  };

  // TODO make this common with playerartifactspane
  const planetArtifactName = (a: Artifact): string | undefined => {
    const onPlanet = uiManager?.getArtifactPlanet(a);
    if (!onPlanet) return undefined;
    return getPlanetName(onPlanet);
  };

  const planetClicked = (): void => {
    if (artifact.onPlanetId) uiManager?.setSelectedId(artifact.onPlanetId);
  };

  let readyInStr = undefined;

  if (artifact.artifactType === ArtifactType.PhotoidCannon && isActivated(artifact)) {
    readyInStr = (
      <TimeUntil
        timestamp={
          artifact.lastActivated * 1000 + contractConstants.PHOTOID_ACTIVATION_DELAY * 1000
        }
        ifPassed={'now!'}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'inline-block' }}>
        <ArtifactImage artifact={artifact} size={32} />
      </div>
      <Spacer width={8} />
      <div style={{ display: 'inline-block' }}>
        {isSpaceShip(artifact.artifactType) ? (
          <>
            <ArtifactName>
              <ArtifactTypeText artifact={artifact} />
            </ArtifactName>
            <ArtifactNameSubtitle>{artifactName(artifact)}</ArtifactNameSubtitle>
          </>
        ) : (
          <>
            <ArtifactName>{artifactName(artifact)}</ArtifactName>
            <ArtifactNameSubtitle>
              <ArtifactRarityLabelAnim rarity={artifact.rarity} />{' '}
              <ArtifactBiomeLabelAnim artifact={artifact} />{' '}
              <ArtifactTypeText artifact={artifact} />
            </ArtifactNameSubtitle>
          </>
        )}
      </div>

      {hasStatBoost(artifact.artifactType) && (
        <ArtifactDetailsHeader>
          <StatsContainer>
            {_.range(0, 5).map((val) => (
              <UpgradeStatInfo
                upgrades={[artifact.upgrade, artifact.timeDelayedUpgrade]}
                stat={val}
                key={val}
              />
            ))}
          </StatsContainer>
        </ArtifactDetailsHeader>
      )}

      {isSpaceShip(artifact.artifactType) && (
        <ArtifactDescription collapsable={false} artifact={artifact} />
      )}

      <StyledArtifactDetailsBody>
        {!isSpaceShip(artifact.artifactType) && <ArtifactDescription artifact={artifact} />}
        <Spacer height={8} />

        <div className='row'>
          <span>位于</span>
          {planetArtifactName(artifact) ? (
            <span className='link' onClick={planetClicked}>
              {planetArtifactName(artifact)}
            </span>
          ) : (
            <span>n / a</span>
          )}
        </div>

        {!isSpaceShip(artifact.artifactType) && (
          <>
            <div className='row'>
              <span>铸造于</span>
              <span>{dateMintedAt(artifact)}</span>
            </div>
            <div className='row'>
              <span>发现于</span>
              <span>{getPlanetNameHash(artifact.planetDiscoveredOn)}</span>
            </div>
            <div className='row'>
              <span>发现者</span>
              <span>{discoverer()}</span>
            </div>
          </>
        )}

        {artifact.controller === EMPTY_ADDRESS && (
          <div className='row'>
            <span>所有者</span>
            <span>{owner()}</span>
          </div>
        )}
        <div className='row'>
          <span>ID</span>
          <TextPreview text={artifact.id} />
        </div>

        {artifact.controller !== EMPTY_ADDRESS && (
          <div className='row'>
            <span>控制器</span>
            <span>
              <AccountLabel ethAddress={artifact.controller} />
            </span>
          </div>
        )}
        {readyInStr && (
          <div className='row'>
            <span>准备就绪</span>
            <span>{readyInStr}</span>
          </div>
        )}

        {!noActions && (
          <ArtifactActions artifactId={artifactWrapper.value?.id} depositOn={depositOn} />
        )}
      </StyledArtifactDetailsBody>
    </>
  );
}

export function ArtifactDetailsPane({
  modal,
  artifactId,
  depositOn,
}: {
  modal: ModalHandle;
  artifactId: ArtifactId;
  depositOn?: LocationId;
}) {
  const uiManager = useUIManager();
  const contractConstants = uiManager.contractConstants;

  return (
    <ArtifactDetailsBody
      modal={modal}
      artifactId={artifactId}
      contractConstants={contractConstants}
      depositOn={depositOn}
    />
  );
}

function ArtifactDescription({
  artifact,
  collapsable,
}: {
  artifact: Artifact;
  collapsable?: boolean;
}) {
  let content;

  const maxLevelsBlackDomain = [0, 2, 4, 6, 8, 9];
  const maxLevelBlackDomain = maxLevelsBlackDomain[artifact.rarity];

  const maxLevelsBloomFilter = [0, 2, 4, 6, 8, 9];
  const maxLevelBloomFilter = maxLevelsBloomFilter[artifact.rarity];

  const wormholeShrinkLevels = [0, 2, 4, 8, 16, 32];
  const rarityName = ArtifactRarityNames[artifact.rarity];
  const photoidRanges = [0, 2, 2, 2, 2, 2];
  const photoidSpeeds = [0, 5, 10, 15, 20, 25];

  const genericSpaceshipDescription = <>可以在不发送能量的情况下在行星之间移动。</>;

  switch (artifact.artifactType) {
    case ArtifactType.BlackDomain:
      content = (
        <Text>
          激活后，将永久禁用您的星球。它仍然是你的，但你不会了
          可以用它做任何事。它也变成完全黑色。就……走了。因为这
          一个是<White>{rarityName}</White>, 它适用于达到以下水平的行星{' '}
          <White>{maxLevelBlackDomain}</White>. 此工件在激活时消耗。
        </Text>
      );
      break;
    case ArtifactType.BloomFilter:
      content = (
        <Text>
          激活后，您星球的能量和银将重新填充到各自的最大值。
          它是如何做到这一点的，我们不知道。因为这个是<White>{rarityName}</White>, 它
          在行星上工作到水平 <White>{maxLevelBloomFilter}</White>. 这个神器是
          激活时消耗。
        </Text>
      );
      break;
    case ArtifactType.Wormhole:
      content = (
        <Text>
          激活后，缩短这颗行星与另一颗行星之间的距离。所有动作
          在这两颗行星之间衰减的能量更少，并且完成得更快.{' '}
          <Red>
            通过你的虫洞发送到你无法控制的行星的能量不会到达。
          </Red>{' '}
          因为这个是 <White>{rarityName}</White>, 它将距离缩小了一个因素{' '}
          <White>{wormholeShrinkLevels[artifact.rarity]}</White>x.
        </Text>
      );
      break;
    case ArtifactType.PhotoidCannon:
      content = (
        <Text>
         啊，Photoid佳能。激活它，等待四个小时。因为这个是{' '}
          <White>{rarityName}</White>, 你发出的下一步动作就能走{' '}
          <White>{photoidRanges[artifact.rarity]}</White>x 进一步和{' '}
          <White>{photoidSpeeds[artifact.rarity]}</White>x 快点。在4个小时的等待期间，
          你星球的防御暂时下降。这个神器一旦设定就被消耗掉
          被解雇了。
        </Text>
      );
      break;
    case ArtifactType.PlanetaryShield:
      content = (
        <Text>
          激活行星护盾以获得行星防御加成，代价是
          范围和速度。当这个神器被停用时，它就会被摧毁，你的星球
          统计数据已恢复——所以请明智地使用它！
        </Text>
      );
      break;
    case ArtifactType.ShipMothership:
      content = (
        <Text>
         使当前所在星球的能量再生加倍.{' '}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipCrescent:
      content = (
        <Text>
          激活以将等级大于 0 的未拥有行星转换为小行星场.{' '}
          <Red>只能使用一次.</Red> {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipGear:
      content = (
        <Text>
         允许您探索行星，并随后在其上找到人工制品.{' '}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipTitan:
      content = (
        <Text>
          暂停它所在星球上的能量和银再生. {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipWhale:
      content = (
        <Text>
          将当前所在星球的银再生加倍.{' '}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
  }

  if (content) {
    return (
      <div>
        {collapsable ? (
          <ReadMore height={'1.2em'} toggleButtonMargin={'0em'}>
            {content}
          </ReadMore>
        ) : (
          content
        )}
      </div>
    );
  }

  return null;
}
