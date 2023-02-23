import { PlanetType, TooltipName } from '@darkforest_eth/types';
import React from 'react';
import { getPlanetRank, isFullRank } from '../../Backend/Utils/Utils';
import { ScoreLabel, SilverLabel } from '../Components/Labels/KeywordLabels';
import { Green, Red, Text, White } from '../Components/Text';
import { useAccount, useSelectedPlanet, useUIManager } from '../Utils/AppHooks';

export function NetworkHealthPane() {
  return (
    <>
      <White>xDAI 发送速度： </White>对于每个自动气体设置（您可以在{' '}
      <White>设置</White> 窗格），与该窗格进行交易所需的平均时间
      设置来确认。黑暗森林客户端上传诊断信息（你可以通过
      设置），它被聚合到这个网络健康指标中。我希望你觉得这对你有帮助
      在网络缓慢的情况下。
    </>
  );
}

export function WithdrawSilverButton() {
  return (
    <>
      这是一个 <Text>时空撕裂</Text> 你可以在那里取款 <SilverLabel /> 为了 <ScoreLabel />
      !
    </>
  );
}
export function DefenseMultiplierPane() {
  return <>防御倍数</>;
}

export function EnergyCapMultiplierPane() {
  return <>EnergyCap乘数</>;
}

export function EnergyGrowthMultiplierPane() {
  return <>能源增长乘数</>;
}

export function RangeMultiplierPane() {
  return <>范围乘数</>;
}

export function SpeedMultiplierPane() {
  return <>速度倍增器</>;
}

export function DepositArtifactPane() {
  return <>存入此神器</>;
}

export function DeactivateArtifactPane() {
  return <>停用此工件</>;
}

export function WithdrawArtifactPane() {
  return <>撤回这个神器</>;
}

export function ActivateArtifactPane() {
  return <>激活这个神器</>;
}

export function TimeUntilActivationPossiblePane() {
  return <>您必须等待这段时间才能激活此神器</>;
}

export function TwitterHandleTooltipPane() {
  return (
    <>
      您可以将您的帐户连接到 <White>推特</White>
      <br />
      在 <White>排行榜</White>.
    </>
  );
}

export function RankTooltipPane() {
  return (
    <>
      您当前的排名，基于 <ScoreLabel />.
    </>
  );
}

export function ScoreTooltipPane() {
  return (
    <>
      你赚 <ScoreLabel /> 通过寻找文物和提取白银。查看{' '}
      <White>帮助面板</White> 有关评分的更多信息。
    </>
  );
}

export function MiningPauseTooltipPane() {
  return (
    <>
      开始/停止你的<White>探险家</White>. 你的探险家寻找大块的行星{' '}
      <White>16</White> x <White>16</White>.
    </>
  );
}

export function MiningTargetTooltipPane() {
  return (
    <>
      改变你的位置<White>探险家</White>. 单击上的任意位置{' '}
      <White>游戏画面</White>, 和你的 <White>矿工</White> 将开始围绕它散列
      块。
    </>
  );
}

export function CurrentMiningTooltipPane() {
  return (
    <>
      你的当前坐标 <White>探险家</White>.
    </>
  );
}

export function BonusTooltipPane() {
  return (
    <>
      <Green>此统计数据已随机翻倍！</Green>
    </>
  );
}

export function SilverTooltipPane() {
  return (
    <>
      <White>银:</White> 宇宙的货币资源。它允许您购买升级。仅有的
      <White> 小行星带</White> 生产银或者我们被告知......
    </>
  );
}

export function EnergyTooltipPane() {
  return (
    <>
      <White>活力:</White> 允许你做出动作。能量增长如下{' '}
      <White>s曲线</White>, 并且增长最快 <White>50% 容量</White>.
    </>
  );
}

export function PlanetRankTooltipPane() {
  const uiManager = useUIManager();
  const selected = useSelectedPlanet(uiManager);
  const rank = getPlanetRank(selected.value);
  return (
    <>
      这个星球是 <White>{isFullRank(selected.value) ? '全面升级' : '排名 ' + rank}</White>
      !
    </>
  );
}

export function MaxLevelTooltipPane() {
  return (
    <>
      这个星球是 <White>等级 9</White>, 使其成为其中之一 <br />
      银河系中最强大的行星！
    </>
  );
}

export function SilverProdTooltipPane() {
  return (
    <>
      这个星球产生 <White>银</White>! 用它来购买升级！
    </>
  );
}

export function SelectedSilverTooltipPane() {
  const uiManager = useUIManager();
  const selected = useSelectedPlanet(uiManager);

  return (
    <>
      {selected.value ? (
        <>
          <>
            银:
            <span>{selected.value.silver}</span>
          </>
          <>
            上限:
            <span>{selected.value.silverCap}</span>
          </>
          {selected.value.planetType === PlanetType.SILVER_MINE ? (
            <>
              生长:
              <span>{selected.value.silverGrowth * 60}</span>
            </>
          ) : (
            <>
              <Red>这个星球不产银.</Red>
            </>
          )}
        </>
      ) : (
        <>选择一颗行星以查看有关其统计数据的更多信息. </>
      )}
    </>
  );
}

export function RangeTooltipPane() {
  return (
    <>
      <White>范围:</White> 你可以派遣你的部队多远. <White>力量衰减</White> 这
      你把他们送到更远的地方。 <br />
      更高的范围意味着您可以以更少的衰减发送相同的距离。
    </>
  );
}

export function MinEnergyTooltipPane() {
  return (
    <>
      从这个星球发出动作所需的最小能量。 <br />
      移动产生的基本成本是地球的 5%<White>能量上限</White>.
    </>
  );
}

export function Time50TooltipPane() {
  return (
    <>
      时间到 <White>50%</White>充满活力.
    </>
  );
}

export function Time90TooltipPane() {
  return (
    <>
      时间到 <White>90%</White> 满满的能量。由于能量在 S 曲线上增长，能量增长
      在这一点上急剧放缓。
    </>
  );
}

export function EnergyGrowthTooltipPane() {
  return (
    <>
      <White>能量增长:</White> 这个星球的能量的最大增长率代表
      率在中间<White>s曲线</White>.
    </>
  );
}

export function SilverGrowthTooltipPane() {
  return (
    <>
      <White>银增长</White>: 这个星球的白银每分钟线性增长率。
    </>
  );
}

export function SilverCapTooltipPane() {
  return (
    <>
      <White>银上限</White>: 这个星球可以容纳的最大白银。
    </>
  );
}

export function PiratesTooltipPane() {
  return (
    <>
      <Red>这个星球有宇宙海盗！</Red> 将能量转移到无人居住的行星上以征服它们！
    </>
  );
}

export function UpgradesTooltipPane() {
  return (
    <>
      <White>星球等级</White>: 您升级星球的次数。
    </>
  );
}

export function ModalHelpTooltipPane() {
  return <>查看补丁说明和说明</>;
}

export function ModalPlanetDetailsTooltipPane() {
  return <>查看所选星球的详细信息</>;
}

export function ModalLeaderboardTooltipPane() {
  return <>查看顶级玩家和他们的顶级行星</>;
}

export function ModalPlanetDexTooltipPane() {
  return <>查看您的行星列表</>;
}

export function ModalUpgradeDetailsTooltipPane() {
  return <>升级选定的星球</>;
}

export function ModalTwitterVerificationTooltipPane() {
  return <>将您的地址连接到 Twitter</>;
}

export function ModalBroadcastTooltipPane() {
  return <>向全世界广播所选行星的坐标</>;
}

export function BonusEnergyCapTooltipPane() {
  return (
    <>
      <Green>
        这个星球的<White>能量上限</White> 已经随机翻倍了！
      </Green>
    </>
  );
}

export function BonusEnergyGroTooltipPane() {
  return (
    <>
      <Green>
        这个星球的<White>能量增长</White> 已经随机翻倍了！
      </Green>
    </>
  );
}

export function BonusRangeTooltipPane() {
  return (
    <>
      <Green>
        这个星球的<White>范围</White> 已经随机翻倍了！
      </Green>
    </>
  );
}

export function BonusSpeedTooltipPane() {
  return (
    <>
      <Green>
        这个星球的<White>速度</White> 已经随机翻倍了！
      </Green>
    </>
  );
}

export function BonusDefenseTooltipPane() {
  return (
    <>
      <Green>
        这个星球的 <White>防御</White> 已经随机翻倍了！
      </Green>
    </>
  );
}

export function BonusSpaceJunkTooltipPane() {
  return (
    <>
      <Green>
        这个星球的 <White>宇宙垃圾</White> 已经随机减半了！
      </Green>
    </>
  );
}

export function ClowntownTooltipPane() {
  const uiManager = useUIManager();
  const selected = useSelectedPlanet(uiManager);
  const account = useAccount(uiManager);

  return (
    <>
      <span>
        {selected.value?.owner === account
          ? `你是小丑镇骄傲的市长！`
          : `这是一个小丑之城...`}
      </span>
    </>
  );
}

function DefenseTooltipPane() {
  return (
    <>
      <White>防御:</White> 具有更高防御力的行星将抵消即将到来的伤害。行星与
      低于 100 的防御是脆弱的，并且会受到更多的伤害！
    </>
  );
}

function SpaceJunkTooltipPane() {
  return (
    <>
      <White>宇宙垃圾:</White> 行星上到处都是垃圾！向行星发送能量
      junk 将从那个星球上删除垃圾并将其添加到您的总垃圾中。一旦你达到你的
      垃圾限制，您将无法捕获有垃圾的行星。放弃行星将
      减少你的太空垃圾并将其放回地球。
    </>
  );
}

function AbandonTooltipPane() {
  const uiManager = useUIManager();
  const abandonSpeedBoost = uiManager.getAbandonSpeedChangePercent() / 100;
  const abandonRangeBoost = uiManager.getAbandonRangeChangePercent() / 100;

  return (
    <>
      <Red>放弃你的星球：</Red> 放弃这个星球的所有权来倾倒你的一些空间
      垃圾在这里。这会触发一个特殊的动作，发送完整的 <White>能量/银</White> 和
      给出一个 <Green>射程提升 {abandonRangeBoost}x</Green> 和一个{' '}
      <Green>速度提升 {abandonSpeedBoost}x</Green>.
      <br />
      <Red>你不能放弃你的家乡星球，或者一个有即将到来的航行的星球。</Red>
    </>
  );
}

function SpeedTooltipPane() {
  return (
    <>
      <White>速度:</White> 能量在宇宙中传播的速度越快
      更好的！
    </>
  );
}

function RetryTransactionPane() {
  return <>重试事务。</>;
}

function CancelTransactionPane() {
  return <>取消交易。</>;
}

function PrioritizeTransactionPane() {
  return <>优先交易。</>;
}

function ArtifactBuffPane() {
  return <>这个星球上一个强大的神器正在影响这个数据！</>;
}

function PluginsTooltipPane() {
  return <>管理插件，它允许您向客户端添加功能。</>;
}

function SettingsPane() {
  return <>管理设置 -导出 SKEY、管理地图等。</>;
}

function YourArtifacts() {
  return <>查看您的工件。</>;
}

function InvadablePane() {
  return <>这个星球处于得分区，可以被入侵</>;
}

function CapturablePane() {
  return <>这个星球已被入侵，这意味着您可以占领它来得分。</>;
}

const ModalWithdrawSilverTooltipPane = () => <>提取银币以赚取分数。</>;

const Hats = () => <>为选定的星球购买帽子。</>;

const FindArtifact = () => (
  <>
    <Green>这颗星球的某处隐藏着一件强大的神器！</Green> 也许你能找到它...
  </>
);

const ArtifactStored = () => <>这颗星球上，有着强大的神器！</>;

const HashesPerSec = () => <>哈希/秒</>;

export function TooltipContent({ name }: { name: TooltipName | undefined }) {
  if (name === TooltipName.SilverGrowth) return <SilverGrowthTooltipPane />;
  if (name === TooltipName.SilverCap) return <SilverCapTooltipPane />;
  if (name === TooltipName.Silver) return <SilverTooltipPane />;
  if (name === TooltipName.Energy) return <EnergyTooltipPane />;
  if (name === TooltipName.EnergyGrowth) return <EnergyGrowthTooltipPane />;
  if (name === TooltipName.Range) return <RangeTooltipPane />;
  if (name === TooltipName.TwitterHandle) return <TwitterHandleTooltipPane />;
  if (name === TooltipName.Bonus) return <BonusTooltipPane />;
  if (name === TooltipName.MinEnergy) return <MinEnergyTooltipPane />;
  if (name === TooltipName.Time50) return <Time50TooltipPane />;
  if (name === TooltipName.Time90) return <Time90TooltipPane />;
  if (name === TooltipName.Pirates) return <PiratesTooltipPane />;
  if (name === TooltipName.Upgrades) return <UpgradesTooltipPane />;
  if (name === TooltipName.PlanetRank) return <PlanetRankTooltipPane />;
  if (name === TooltipName.MaxLevel) return <MaxLevelTooltipPane />;
  if (name === TooltipName.SelectedSilver) return <SelectedSilverTooltipPane />;
  if (name === TooltipName.Rank) return <RankTooltipPane />;
  if (name === TooltipName.Score) return <ScoreTooltipPane />;
  if (name === TooltipName.MiningPause) return <MiningPauseTooltipPane />;
  if (name === TooltipName.MiningTarget) return <MiningTargetTooltipPane />;
  if (name === TooltipName.CurrentMining) return <CurrentMiningTooltipPane />;
  if (name === TooltipName.SilverProd) return <SilverProdTooltipPane />;
  if (name === TooltipName.BonusEnergyCap) return <BonusEnergyCapTooltipPane />;
  if (name === TooltipName.BonusEnergyGro) return <BonusEnergyGroTooltipPane />;
  if (name === TooltipName.BonusRange) return <BonusRangeTooltipPane />;
  if (name === TooltipName.BonusSpeed) return <BonusSpeedTooltipPane />;
  if (name === TooltipName.BonusDefense) return <BonusDefenseTooltipPane />;
  if (name === TooltipName.BonusSpaceJunk) return <BonusSpaceJunkTooltipPane />;
  if (name === TooltipName.Clowntown) return <ClowntownTooltipPane />;
  if (name === TooltipName.ModalHelp) return <ModalHelpTooltipPane />;
  if (name === TooltipName.ModalPlanetDetails) return <ModalPlanetDetailsTooltipPane />;
  if (name === TooltipName.ModalLeaderboard) return <ModalLeaderboardTooltipPane />;
  if (name === TooltipName.ModalPlanetDex) return <ModalPlanetDexTooltipPane />;
  if (name === TooltipName.ModalUpgradeDetails) return <ModalUpgradeDetailsTooltipPane />;
  if (name === TooltipName.ModalTwitterVerification) return <ModalTwitterVerificationTooltipPane />;
  if (name === TooltipName.ModalTwitterBroadcast) return <ModalBroadcastTooltipPane />;
  if (name === TooltipName.Defense) return <DefenseTooltipPane />;
  if (name === TooltipName.SpaceJunk) return <SpaceJunkTooltipPane />;
  if (name === TooltipName.Abandon) return <AbandonTooltipPane />;
  if (name === TooltipName.Speed) return <SpeedTooltipPane />;
  if (name === TooltipName.ArtifactBuff) return <ArtifactBuffPane />;
  if (name === TooltipName.ModalPlugins) return <PluginsTooltipPane />;
  if (name === TooltipName.ModalSettings) return <SettingsPane />;
  if (name === TooltipName.ModalYourArtifacts) return <YourArtifacts />;
  if (name === TooltipName.ModalHats) return <Hats />;
  if (name === TooltipName.FindArtifact) return <FindArtifact />;
  if (name === TooltipName.ArtifactStored) return <ArtifactStored />;
  if (name === TooltipName.HashesPerSec) return <HashesPerSec />;
  if (name === TooltipName.ModalWithdrawSilver) return <ModalWithdrawSilverTooltipPane />;
  if (name === TooltipName.TimeUntilActivationPossible) return <TimeUntilActivationPossiblePane />;
  if (name === TooltipName.DepositArtifact) return <DepositArtifactPane />;
  if (name === TooltipName.DeactivateArtifact) return <DeactivateArtifactPane />;
  if (name === TooltipName.WithdrawArtifact) return <WithdrawArtifactPane />;
  if (name === TooltipName.ActivateArtifact) return <ActivateArtifactPane />;
  if (name === TooltipName.DefenseMultiplier) return <DefenseMultiplierPane />;
  if (name === TooltipName.EnergyCapMultiplier) return <EnergyCapMultiplierPane />;
  if (name === TooltipName.EnergyGrowthMultiplier) return <EnergyGrowthMultiplierPane />;
  if (name === TooltipName.RangeMultiplier) return <RangeMultiplierPane />;
  if (name === TooltipName.SpeedMultiplier) return <SpeedMultiplierPane />;
  if (name === TooltipName.NetworkHealth) return <NetworkHealthPane />;
  if (name === TooltipName.WithdrawSilverButton) return <WithdrawSilverButton />;
  if (name === TooltipName.RetryTransaction) return <RetryTransactionPane />;
  if (name === TooltipName.CancelTransaction) return <CancelTransactionPane />;
  if (name === TooltipName.PrioritizeTransaction) return <PrioritizeTransactionPane />;
  if (name === TooltipName.Invadable) return <InvadablePane />;
  if (name === TooltipName.Capturable) return <CapturablePane />;
  return <></>;
}
