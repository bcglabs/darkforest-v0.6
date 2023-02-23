import { EthConnection } from '@darkforest_eth/network';
import { AutoGasSetting, Chunk, ModalName, Setting } from '@darkforest_eth/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TutorialManager from '../../Backend/GameLogic/TutorialManager';
import { Btn } from '../Components/Btn';
import { Section, SectionHeader, Spacer } from '../Components/CoreUI';
import { DarkForestTextInput, TextInput } from '../Components/Input';
import { Slider } from '../Components/Slider';
import { Green, Red } from '../Components/Text';
import Viewport, { getDefaultScroll } from '../Game/Viewport';
import { useAccount, useUIManager } from '../Utils/AppHooks';
import { useEmitterValue } from '../Utils/EmitterHooks';
import {
  BooleanSetting,
  ColorSetting,
  MultiSelectSetting,
  NumberSetting,
} from '../Utils/SettingsHooks';
import { ModalPane } from '../Views/ModalPane';

const SCROLL_MIN = 0.0001 * 10000;
const SCROLL_MAX = 0.01 * 10000;
const DEFAULT_SCROLL = Math.round(10000 * (getDefaultScroll() - 1));

const SettingsContent = styled.div`
  width: 500px;
  height: 500px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  text-align: justify;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;

  justify-content: space-between;
  align-items: center;

  & > span:first-child {
    flex-grow: 1;
  }
`;

export function SettingsPane({
  ethConnection,
  visible,
  onClose,
  onOpenPrivate,
}: {
  ethConnection: EthConnection;
  visible: boolean;
  onClose: () => void;
  onOpenPrivate: () => void;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const gasPrices = useEmitterValue(ethConnection.gasPrices$, ethConnection.getAutoGasPrices());

  const [rpcUrl, setRpcURL] = useState<string>(ethConnection.getRpcEndpoint());
  const onChangeRpc = () => {
    ethConnection
      .setRpcUrl(rpcUrl)
      .then(() => {
        localStorage.setItem('XDAI_RPC_ENDPOINT_v5', rpcUrl);
      })
      .catch(() => {
        setRpcURL(ethConnection.getRpcEndpoint());
      });
  };

  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (!uiManager) return;
    const updateBalance = () => {
      setBalance(uiManager.getMyBalance());
    };

    updateBalance();
    const intervalId = setInterval(updateBalance, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [uiManager]);

  const [failure, setFailure] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [importMapByTextBoxValue, setImportMapByTextBoxValue] = useState('');
  useEffect(() => {
    if (failure) {
      setSuccess('');
    }
  }, [failure]);
  useEffect(() => {
    if (success) {
      setFailure('');
    }
  }, [success]);
  const onExportMap = async () => {
    if (uiManager) {
      const chunks = uiManager.getExploredChunks();
      const chunksAsArray = Array.from(chunks);
      try {
        const map = JSON.stringify(chunksAsArray);
        await window.navigator.clipboard.writeText(map);
        setSuccess('复制的地图！');
      } catch (err) {
        console.error(err);
        setFailure('导出失败');
      }
    } else {
      setFailure('现在无法导出地图。');
    }
  };
  const onImportMapFromTextBox = async () => {
    try {
      const chunks = JSON.parse(importMapByTextBoxValue);
      await uiManager.bulkAddNewChunks(chunks as Chunk[]);
      setImportMapByTextBoxValue('');
    } catch (e) {
      setFailure('地图数据无效。检查剪贴板中的数据。');
    }
  };
  const onImportMap = async () => {
    if (uiManager) {
      let input;
      try {
        input = await window.navigator.clipboard.readText();
      } catch (err) {
        console.error(err);
        setFailure('无法导入地图。您是否允许访问剪贴板？');
        return;
      }

      let chunks;
      try {
        chunks = JSON.parse(input);
      } catch (err) {
        console.error(err);
        setFailure('地图数据无效。检查剪贴板中的数据。');
        return;
      }
      await uiManager.bulkAddNewChunks(chunks as Chunk[]);
      setSuccess('成功导入地图！');
    } else {
      setFailure('现在无法导入地图。');
    }
  };

  const [clicks, setClicks] = useState<number>(8);
  const doPrivateClick = () => {
    setClicks((x) => x - 1);
    if (clicks === 1) {
      onOpenPrivate();
      setClicks(5);
    }
  };

  const [scrollSpeed, setScrollSpeed] = useState<number>(DEFAULT_SCROLL);
  const onScrollChange = (e: Event & React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) setScrollSpeed(value);
  };

  useEffect(() => {
    const scroll = localStorage.getItem('scrollSpeed');
    if (scroll) {
      setScrollSpeed(10000 * (parseFloat(scroll) - 1));
    }
  }, [setScrollSpeed]);

  useEffect(() => {
    if (!Viewport.instance) return;
    Viewport.instance.setMouseSensitivty(scrollSpeed / 10000);
  }, [scrollSpeed]);

  return (
    <ModalPane id={ModalName.Settings} title='设置' visible={visible} onClose={onClose}>
      <SettingsContent>
        {isDevelopment && (
          <Section>
            <SectionHeader>发展</SectionHeader>
            <BooleanSetting
              uiManager={uiManager}
              setting={Setting.ForceReloadEmbeddedPlugins}
              settingDescription={'强制重新加载嵌入式插件'}
            />
          </Section>
        )}

        <Section>
          <SectionHeader>燃烧室 钱包信息</SectionHeader>
          <Row>
            <span>公钥</span>
            <span>{account}</span>
          </Row>
          <Row>
            <span>余额</span>
            <span>{balance}</span>
          </Row>
        </Section>

        <Section>
          <SectionHeader>天然气价格</SectionHeader>
          您的 gas 价格设置决定了您为每笔交易支付的价格。更高的气体
          价格意味着您的交易将被区块链优先考虑，使它们得到确认
          快点。我们建议使用自动平均设置。所有自动设置价格都被拉了 来自 oracle，上限为 15 gwei。
          <Spacer height={16} />
          <MultiSelectSetting
            wide
            uiManager={uiManager}
            setting={Setting.GasFeeGwei}
            values={[
              '1',
              '2',
              '5',
              '10',
              '20',
              '40',
              AutoGasSetting.Slow,
              AutoGasSetting.Average,
              AutoGasSetting.Fast,
            ]}
            labels={[
              '1 gwei (default)',
              '2 gwei (faster)',
              '5 gwei (turbo)',
              '10 gwei (mega turbo)',
              '20 gwei (need4speed)',
              '40 gwei (gigafast)',
              `slow auto (~${gasPrices.slow} gwei)`,
              `average auto (~${gasPrices.average} gwei)`,
              `fast auto (~${gasPrices.fast} gwei)`,
            ]}
          />
        </Section>

        <Section>
          <SectionHeader>燃烧室 钱包信息（私人）</SectionHeader>
          你的秘密密钥，连同你家乡星球的坐标，授予你访问你的
          不同浏览器上的黑暗森林帐户。您应该将此信息保存在您的某个位置 电脑。
          <Spacer height={16} />
          <Red>警告:</Red> 永远不要将此发送给任何人！
          <Spacer height={8} />
          <Btn size='stretch' variant='danger' onClick={doPrivateClick}>
            点击 {clicks} 查看信息的次数
          </Btn>
        </Section>

        <Section>
          <SectionHeader>自动确认交易</SectionHeader>
          是否自动确认所有交易，购买除外。这将使您能够
          采取行动、花费银币进行升级等，无需您确认每一项 交易。但是，客户将在发送交易前要求确认
          花费钱包资金。
          <Spacer height={16} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.AutoApproveNonPurchaseTransactions}
            settingDescription={'自动确认非购买交易'}
          />
        </Section>

        <Section>
          <SectionHeader>导入和导出地图数据</SectionHeader>
          <Red>警告:</Red> 其他人的地图可能会被更改，但不保证是 正确的！
          <Spacer height={16} />
          <TextInput
            value={importMapByTextBoxValue}
            placeholder={'在此处粘贴地图内容'}
            onChange={(e: Event & React.ChangeEvent<DarkForestTextInput>) =>
              setImportMapByTextBoxValue(e.target.value)
            }
          />
          <Spacer height={8} />
          <Btn
            size='stretch'
            onClick={onImportMapFromTextBox}
            disabled={importMapByTextBoxValue.length === 0}
          >
            从上方导入地图
          </Btn>
          <Spacer height={8} />
          <Btn size='stretch' onClick={onExportMap}>
            将地图复制到剪贴板
          </Btn>
          <Spacer height={8} />
          <Btn size='stretch' onClick={onImportMap}>
            从剪贴板导入地图
          </Btn>
          <Spacer height={8} />
          <Green>{success}</Green>
          <Red>{failure}</Red>
        </Section>

        <Section>
          <SectionHeader>更改 RPC 端点</SectionHeader>
          <Spacer height={8} />
          当前 RPC 端点: {rpcUrl}
          <Spacer height={8} />
          <TextInput
            value={rpcUrl}
            onChange={(e: Event & React.ChangeEvent<DarkForestTextInput>) =>
              setRpcURL(e.target.value)
            }
          />
          <Spacer height={8} />
          <Btn size='stretch' onClick={onChangeRpc}>
            更改 RPC URL
          </Btn>
        </Section>

        <Section>
          <SectionHeader>指标选择退出</SectionHeader>
          我们收集了一组最小的数据和统计数据，例如 SNARK 证明时间、平均 跨浏览器的交易时间和 xDAI
          交易错误，以帮助我们优化 性能和修复错误。这不包括电子邮件或 IP 地址等个人数据。
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.OptOutMetrics}
            settingDescription='指标选择退出'
          />
        </Section>

        <Section>
          <SectionHeader>表现</SectionHeader>
          高性能模式关闭背景渲染，并减少细节 渲染较小的行星。
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.HighPerformanceRendering}
            settingDescription='高性能模式'
          />
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.DisableEmojiRendering}
            settingDescription='禁用表情符号渲染'
          />
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.DisableHatRendering}
            settingDescription='禁用帽子渲染'
          />
        </Section>

        <Section>
          <SectionHeader>通知</SectionHeader>
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.MoveNotifications}
            settingDescription='显示移动交易的通知'
          />
          <Spacer height={8} />
          这么多秒后自动清除交易确认通知。设置为 负数不自动清除。
          <Spacer height={8} />
          <NumberSetting
            uiManager={uiManager}
            setting={Setting.AutoClearConfirmedTransactionsAfterSeconds}
          />
          <Spacer height={8} />
          这么多秒后自动清除交易拒绝通知。设置为负 数字不自动清除。
          <NumberSetting
            uiManager={uiManager}
            setting={Setting.AutoClearRejectedTransactionsAfterSeconds}
          />
        </Section>

        <Section>
          <SectionHeader>滚动速度</SectionHeader>
          <Spacer height={8} />
          <Slider
            variant='filled'
            editable={true}
            labelVisibility='none'
            value={scrollSpeed}
            min={SCROLL_MIN}
            max={SCROLL_MAX}
            step={SCROLL_MIN / 10}
            onChange={onScrollChange}
          />
        </Section>

        <Section>
          <SectionHeader>重置教程</SectionHeader>
          <Spacer height={8} />
          <Btn size='stretch' onClick={() => TutorialManager.getInstance(uiManager).reset()}>
            重置教程
          </Btn>
        </Section>

        <Section>
          <SectionHeader>禁用默认快捷方式</SectionHeader>
          如果您想通过插件使用自定义快捷方式，您可以禁用默认快捷方式 这里。
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.DisableDefaultShortcuts}
            settingDescription='切换禁用默认快捷方式'
          />
        </Section>

        <Section>
          <SectionHeader>启用实验性功能</SectionHeader>
          尚未完全准备好投入生产但我们认为很酷的功能。
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.ExperimentalFeatures}
            settingDescription='切换实验功能'
          />
        </Section>

        <Section>
          <SectionHeader>渲染器设置</SectionHeader>
          游戏中包含的默认渲染器的一些选项。
          <Spacer height={8} />
          <BooleanSetting
            uiManager={uiManager}
            setting={Setting.DisableFancySpaceEffect}
            settingDescription='禁用花哨的空间着色器'
          />
          <Spacer height={8} />
          <ColorSetting
            uiManager={uiManager}
            setting={Setting.RendererColorInnerNebula}
            settingDescription='内部星云颜色'
          />
          <ColorSetting
            uiManager={uiManager}
            setting={Setting.RendererColorNebula}
            settingDescription='星云颜色'
          />
          <ColorSetting
            uiManager={uiManager}
            setting={Setting.RendererColorSpace}
            settingDescription='空间颜色'
          />
          <ColorSetting
            uiManager={uiManager}
            setting={Setting.RendererColorDeepSpace}
            settingDescription='深空颜色'
          />
          <ColorSetting
            uiManager={uiManager}
            setting={Setting.RendererColorDeadSpace}
            settingDescription='死亡空间颜色'
          />
        </Section>
      </SettingsContent>
    </ModalPane>
  );
}
