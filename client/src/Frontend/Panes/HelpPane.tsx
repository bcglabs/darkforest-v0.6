import { ArtifactRarity, ModalName, PlanetLevel } from '@darkforest_eth/types';
import React from 'react';
import styled from 'styled-components';
import { EmSpacer, Link, Section, SectionHeader } from '../Components/CoreUI';
import { ArtifactRarityLabel } from '../Components/Labels/ArtifactLabels';
import { Gold, White } from '../Components/Text';
import dfstyles from '../Styles/dfstyles';
import { useUIManager } from '../Utils/AppHooks';
import { ModalPane } from '../Views/ModalPane';

const HelpContent = styled.div`
  width: 500px;
  height: 500px;
  max-height: 500px;
  max-width: 500px;
  overflow-y: scroll;
  text-align: justify;
  color: ${dfstyles.colors.text};
`;

export function HelpPane({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const uiManager = useUIManager();

  const silverScoreValue = uiManager.getSilverScoreValue();
  const artifactPointValues = uiManager.getArtifactPointValues();
  const captureZonePointValues = uiManager.getCaptureZonePointValues();

  return (
    <ModalPane id={ModalName.Help} title='帮助' visible={visible} onClose={onClose}>
      <HelpContent>
        {uiManager.isRoundOver() && (
          <Section>
            <SectionHeader>第 5 轮完成</SectionHeader>
            黑暗森林 v0.6 第 5 轮现已完成！分数正在编制中，获奖者将
            不久宣布。此外，神器将不再是可铸造的。感谢参与！
          </Section>
        )}

        <Section>
          <SectionHeader>首先，一些链接:</SectionHeader>
          <Link to='https://blog.zkga.me'>官方信息和公告</Link>
          <br />
          <Link to='https://twitter.com/darkforest_eth'>官方 Twitter</Link>
          <br />
          <Link to='https://discord.gg/2u2TN6v8r6'>官方 Discord 服务器</Link>
          <br />
          <Link to='https://dfwiki.net/'>社区经营 Wiki</Link>
          <br />
          <br />
          其次...欢迎来到
        </Section>

        <Section>
          <SectionHeader>黑暗森林 v0.6 R5：垃圾战争</SectionHeader>
          黑暗森林是一个广阔的宇宙，被零知识密码学所迷惑。你的 <White>探险家</White>{' '}
          （左下）探索宇宙，寻找 <White>行星</White> 和其他玩家。
          <EmSpacer height={1} />
          所有行星都生产<White>活力</White>. 您可以单击并拖动以从行星上移动能量
          你拥有新的行星来征服它们。
          <EmSpacer height={1} />
          散布在宇宙中的还有 <White>小行星带</White>, 产生 <White>银</White>.
          白银可以传送到行星，也可以花在 <White>升级</White>.
          <EmSpacer height={1} /> 有些行星包含 <White>神器</White> - ERC721 表示
          可以与其他玩家交易。可以收获人工制品并将其存放在行星上， 抛光他们的统计数据。
        </Section>

        <Section>
          <SectionHeader>奖品及计分</SectionHeader>分数的快照将被拍摄{' '}
          <White>2022 年 2 月 28 日</White> 太平洋时间晚上 9 点。当时63强 得分最高的玩家将从 63
          个奖品星球中获得奖品。你可以看到 通过在游戏的登录页面上向下滚动来查看当前排名。
          <EmSpacer height={1} />
          这一轮的得分由三部分组成：使用你的装备船寻找神器， 从 Spacetime Rips
          中提取白银，并入侵并捕获其中的行星 捕获区。有关捕获区的更多信息，请将鼠标悬停在“捕获区”上
          屏幕顶部的部分。
          <EmSpacer height={1} />
          下面提供了每种评分类型的值：
        </Section>

        <Section>
          <SectionHeader>评分值</SectionHeader>
          每一个单 <Gold>银</Gold> 你退出增加你的分数 {silverScoreValue / 100}.
          <EmSpacer height={1} />
          发现神器会根据其稀有性增加您的分数：
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Common} />:{' '}
          {artifactPointValues[ArtifactRarity.Common]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Rare} />:{' '}
          {artifactPointValues[ArtifactRarity.Rare]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Epic} />:{' '}
          {artifactPointValues[ArtifactRarity.Epic]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Legendary} />:{' '}
          {artifactPointValues[ArtifactRarity.Legendary]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Mythic} />:{' '}
          {artifactPointValues[ArtifactRarity.Mythic]}
          <EmSpacer height={1} />
          占领一颗被入侵的行星会根据其等级增加你的分数：
          <br />
          等级 {PlanetLevel.ZERO}: {captureZonePointValues[PlanetLevel.ZERO]}
          <br />
          等级 {PlanetLevel.ONE}: {captureZonePointValues[PlanetLevel.ONE]}
          <br />
          等级 {PlanetLevel.TWO}: {captureZonePointValues[PlanetLevel.TWO]}
          <br />
          等级 {PlanetLevel.THREE}: {captureZonePointValues[PlanetLevel.THREE]}
          <br />
          等级 {PlanetLevel.FOUR}: {captureZonePointValues[PlanetLevel.FOUR]}
          <br />
          等级 {PlanetLevel.FIVE}: {captureZonePointValues[PlanetLevel.FIVE]}
          <br />
          等级 {PlanetLevel.SIX}: {captureZonePointValues[PlanetLevel.SIX]}
          <br />
          等级 {PlanetLevel.SEVEN}: {captureZonePointValues[PlanetLevel.SEVEN]}
          <br />
          等级 {PlanetLevel.EIGHT}: {captureZonePointValues[PlanetLevel.EIGHT]}
          <br />
          等级 {PlanetLevel.NINE}: {captureZonePointValues[PlanetLevel.NINE]}
        </Section>
      </HelpContent>
    </ModalPane>
  );
}
