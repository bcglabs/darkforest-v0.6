import { BLOCK_EXPLORER_URL } from '@darkforest_eth/constants';
import { CONTRACT_ADDRESS } from '@darkforest_eth/contracts';
import { DarkForest } from '@darkforest_eth/contracts/typechain';
import { EthConnection, neverResolves, weiToEth } from '@darkforest_eth/network';
import { address } from '@darkforest_eth/serde';
import { bigIntFromKey } from '@darkforest_eth/whitelist';
import { utils, Wallet } from 'ethers';
import { reverse } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { makeContractsAPI } from '../../Backend/GameLogic/ContractsAPI';
import GameManager, { GameManagerEvent } from '../../Backend/GameLogic/GameManager';
import GameUIManager from '../../Backend/GameLogic/GameUIManager';
import TutorialManager, { TutorialState } from '../../Backend/GameLogic/TutorialManager';
import { addAccount, getAccounts } from '../../Backend/Network/AccountManager';
import { getEthConnection, loadDiamondContract } from '../../Backend/Network/Blockchain';
import {
  callRegisterAndWaitForConfirmation,
  EmailResponse,
  RegisterConfirmationResponse,
  requestDevFaucet,
  submitInterestedEmail,
  submitPlayerEmail,
} from '../../Backend/Network/UtilityServerAPI';
import { getWhitelistArgs } from '../../Backend/Utils/WhitelistSnarkArgsHelper';
import { ZKArgIdx } from '../../_types/darkforest/api/ContractsAPITypes';
import {
  GameWindowWrapper,
  InitRenderState,
  TerminalToggler,
  TerminalWrapper,
  Wrapper,
} from '../Components/GameLandingPageComponents';
import { MythicLabelText } from '../Components/Labels/MythicLabel';
import { TextPreview } from '../Components/TextPreview';
import { TopLevelDivProvider, UIManagerProvider } from '../Utils/AppHooks';
import { Incompatibility, unsupportedFeatures } from '../Utils/BrowserChecks';
import { TerminalTextStyle } from '../Utils/TerminalTypes';
import UIEmitter, { UIEmitterEvent } from '../Utils/UIEmitter';
import { GameWindowLayout } from '../Views/GameWindowLayout';
import { Terminal, TerminalHandle } from '../Views/Terminal';

const enum TerminalPromptStep {
  NONE,
  COMPATIBILITY_CHECKS_PASSED,
  DISPLAY_ACCOUNTS,
  GENERATE_ACCOUNT,
  IMPORT_ACCOUNT,
  ACCOUNT_SET,
  ASKING_HAS_WHITELIST_KEY,
  ASKING_WAITLIST_EMAIL,
  ASKING_WHITELIST_KEY,
  ASKING_PLAYER_EMAIL,
  FETCHING_ETH_DATA,
  ASK_ADD_ACCOUNT,
  ADD_ACCOUNT,
  NO_HOME_PLANET,
  SEARCHING_FOR_HOME_PLANET,
  ALL_CHECKS_PASS,
  COMPLETE,
  TERMINATED,
  ERROR,
}

export function GameLandingPage({ match, location }: RouteComponentProps<{ contract: string }>) {
  const history = useHistory();
  const terminalHandle = useRef<TerminalHandle>();
  const gameUIManagerRef = useRef<GameUIManager | undefined>();
  const topLevelContainer = useRef<HTMLDivElement | null>(null);

  const [gameManager, setGameManager] = useState<GameManager | undefined>();
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [initRenderState, setInitRenderState] = useState(InitRenderState.NONE);
  const [ethConnection, setEthConnection] = useState<EthConnection | undefined>();
  const [step, setStep] = useState(TerminalPromptStep.NONE);

  const params = new URLSearchParams(location.search);
  const useZkWhitelist = params.has('zkWhitelist');
  const selectedAddress = params.get('account');
  const contractAddress = address(match.params.contract);
  const isLobby = contractAddress !== address(CONTRACT_ADDRESS);

  useEffect(() => {
    getEthConnection()
      .then((ethConnection) => setEthConnection(ethConnection))
      .catch((e) => {
        alert('连接到区块链时出错');
        console.log(e);
      });
  }, []);

  const isProd = process.env.NODE_ENV === 'production';

  const advanceStateFromNone = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const issues = await unsupportedFeatures();

      if (issues.includes(Incompatibility.MobileOrTablet)) {
        terminal.current?.println(
          '错误：检测到移动或平板设备。请使用台式机。',
          TerminalTextStyle.Red
        );
      }

      if (issues.includes(Incompatibility.NoIDB)) {
        terminal.current?.println(
          '错误：未找到 IndexedDB。尝试使用不同的浏览器。',
          TerminalTextStyle.Red
        );
      }

      if (issues.includes(Incompatibility.UnsupportedBrowser)) {
        terminal.current?.println(
          '错误：浏览器不受支持。试试 Brave、Firefox 或 Chrome。',
          TerminalTextStyle.Red
        );
      }

      if (issues.length > 0) {
        terminal.current?.print(
          `${issues.length.toString()} 发现错误。 `,
          TerminalTextStyle.Red
        );
        terminal.current?.println('请解决它们并刷新页面。');
        setStep(TerminalPromptStep.ASKING_WAITLIST_EMAIL);
      } else {
        setStep(TerminalPromptStep.COMPATIBILITY_CHECKS_PASSED);
      }
    },
    []
  );

  const advanceStateFromCompatibilityPassed = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      if (isLobby) {
        terminal.current?.newline();
        terminal.current?.printElement(
          <MythicLabelText text={`您正在加入一个黑暗森林大厅`} />
        );
        terminal.current?.newline();
        terminal.current?.newline();
      } else {
        terminal.current?.newline();
        terminal.current?.newline();
        terminal.current?.printElement(<MythicLabelText text={`                 黑暗森林`} />);
        terminal.current?.newline();
        terminal.current?.newline();

        terminal.current?.print('    ');
        terminal.current?.print('版本', TerminalTextStyle.Sub);
        terminal.current?.print('    ');
        terminal.current?.print('日期', TerminalTextStyle.Sub);
        terminal.current?.print('              ');
        terminal.current?.print('冠军', TerminalTextStyle.Sub);
        terminal.current?.newline();

        terminal.current?.print('    v0.1       ', TerminalTextStyle.Text);
        terminal.current?.print('02/05/2020        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          'Dylan Field',
          () => {
            window.open('https://twitter.com/zoink');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();
        terminal.current?.print('    v0.2       ', TerminalTextStyle.Text);
        terminal.current?.println('06/06/2020        Nate Foss', TerminalTextStyle.Text);
        terminal.current?.print('    v0.3       ', TerminalTextStyle.Text);
        terminal.current?.print('08/07/2020        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          '@hideandcleanse',
          () => {
            window.open('https://twitter.com/hideandcleanse');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();
        terminal.current?.print('    v0.4       ', TerminalTextStyle.Text);
        terminal.current?.print('10/02/2020        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          'Jacob Rosenthal',
          () => {
            window.open('https://twitter.com/jacobrosenthal');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();
        terminal.current?.print('    v0.5       ', TerminalTextStyle.Text);
        terminal.current?.print('12/25/2020        ', TerminalTextStyle.Text);
        terminal.current?.printElement(
          <TextPreview
            text={'0xb05d95422bf8d5024f9c340e8f7bd696d67ee3a9'}
            focusedWidth={'100px'}
            unFocusedWidth={'100px'}
          />
        );
        terminal.current?.println('');

        terminal.current?.print('    v0.6 r1    ', TerminalTextStyle.Text);
        terminal.current?.print('05/22/2021        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          'Ansgar Dietrichs',
          () => {
            window.open('https://twitter.com/adietrichs');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();

        terminal.current?.print('    v0.6 r2    ', TerminalTextStyle.Text);
        terminal.current?.print('06/28/2021        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          '@orden_gg',
          () => {
            window.open('https://twitter.com/orden_gg');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();

        terminal.current?.print('    v0.6 r3    ', TerminalTextStyle.Text);
        terminal.current?.print('08/22/2021        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          '@dropswap_gg',
          () => {
            window.open('https://twitter.com/dropswap_gg');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();

        terminal.current?.print('    v0.6 r4    ', TerminalTextStyle.Text);
        terminal.current?.print('10/01/2021        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          '@orden_gg',
          () => {
            window.open('https://twitter.com/orden_gg');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();

        terminal.current?.print('    v0.6 r5    ', TerminalTextStyle.Text);
        terminal.current?.print('02/18/2022        ', TerminalTextStyle.Text);
        terminal.current?.printLink(
          '@d_fdao',
          () => {
            window.open('https://twitter.com/d_fdao');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.print(' + ');
        terminal.current?.printLink(
          '@orden_gg',
          () => {
            window.open('https://twitter.com/orden_gg');
          },
          TerminalTextStyle.Text
        );
        terminal.current?.newline();
        terminal.current?.newline();
      }

      const accounts = getAccounts();
      terminal.current?.println(`此设备上存在 ${accounts.length}个帐户。`);
      terminal.current?.println(``);

      if (accounts.length > 0) {
        terminal.current?.print('(a) ', TerminalTextStyle.Sub);
        terminal.current?.println('使用现有帐户登录。');
      }

      terminal.current?.print('(n) ', TerminalTextStyle.Sub);
      terminal.current?.println(`生成新的 Burner 钱包帐户。`);
      terminal.current?.print('(i) ', TerminalTextStyle.Sub);
      terminal.current?.println(`导入私钥。`);
      terminal.current?.println(``);
      terminal.current?.println(`选择一个选项：`, TerminalTextStyle.Text);

      if (selectedAddress !== null) {
        terminal.current?.println(
          `从网址选择账户 ${selectedAddress} ...`,
          TerminalTextStyle.Green
        );

        // Search accounts backwards in case a player has used a private key more than once.
        // In that case, we want to take the most recently created account.
        const account = reverse(getAccounts()).find((a) => a.address === selectedAddress);
        if (!account) {
          terminal.current?.println('在 url 中发现无法识别的帐户。', TerminalTextStyle.Red);
          return;
        }

        try {
          await ethConnection?.setAccount(account.privateKey);
          setStep(TerminalPromptStep.ACCOUNT_SET);
        } catch (e) {
          terminal.current?.println(
            '出现未知错误。请再试一次.',
            TerminalTextStyle.Red
          );
        }
      } else {
        const userInput = await terminal.current?.getInput();
        if (userInput === 'a' && accounts.length > 0) {
          setStep(TerminalPromptStep.DISPLAY_ACCOUNTS);
        } else if (userInput === 'n') {
          setStep(TerminalPromptStep.GENERATE_ACCOUNT);
        } else if (userInput === 'i') {
          setStep(TerminalPromptStep.IMPORT_ACCOUNT);
        } else {
          terminal.current?.println('无法识别的输入。请再试一次。');
          await advanceStateFromCompatibilityPassed(terminal);
        }
      }
    },
    [isLobby, ethConnection, selectedAddress]
  );

  const advanceStateFromDisplayAccounts = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println(``);
      const accounts = getAccounts();
      for (let i = 0; i < accounts.length; i += 1) {
        terminal.current?.print(`(${i + 1}): `, TerminalTextStyle.Sub);
        terminal.current?.println(`${accounts[i].address}`);
      }
      terminal.current?.println(``);
      terminal.current?.println(`选择一个帐户：`, TerminalTextStyle.Text);

      const selection = +((await terminal.current?.getInput()) || '');
      if (isNaN(selection) || selection > accounts.length) {
        terminal.current?.println('无法识别的输入。请再试一次。');
        await advanceStateFromDisplayAccounts(terminal);
      } else {
        const account = accounts[selection - 1];
        try {
          await ethConnection?.setAccount(account.privateKey);
          setStep(TerminalPromptStep.ACCOUNT_SET);
        } catch (e) {
          terminal.current?.println(
            '出现未知错误。请再试一次。',
            TerminalTextStyle.Red
          );
        }
      }
    },
    [ethConnection]
  );

  const advanceStateFromGenerateAccount = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const newWallet = Wallet.createRandom();
      const newSKey = newWallet.privateKey;
      const newAddr = address(newWallet.address);
      try {
        addAccount(newSKey);
        ethConnection?.setAccount(newSKey);

        terminal.current?.println(``);
        terminal.current?.print(`使用地址创建新的 Burner 钱包`);
        terminal.current?.printElement(<TextPreview text={newAddr} unFocusedWidth={'100px'} />);
        terminal.current?.println(``);
        terminal.current?.println('');
        terminal.current?.println(
          'Noteburner 钱包存储在本地存储中。',
          TerminalTextStyle.Text
        );
        terminal.current?.println('他们相对不安全，你应该避免');
        terminal.current?.println('在其中存储大量资金。');
        terminal.current?.println('');
        terminal.current?.println('此外，清除浏览器本地存储/缓存将呈现您的');
        terminal.current?.println(
          'Burner 钱包无法访问，除非您导出您的私钥。'
        );
        terminal.current?.println('');
        terminal.current?.println('按任意键继续：', TerminalTextStyle.Text);

        await terminal.current?.getInput();
        setStep(TerminalPromptStep.ACCOUNT_SET);
      } catch (e) {
        terminal.current?.println(
          '出现未知错误。请再试一次。',
          TerminalTextStyle.Red
        );
      }
    },
    [ethConnection]
  );

  const advanceStateFromImportAccount = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println(
        '输入您要导入的帐户的 0x 前缀私钥',
        TerminalTextStyle.Text
      );
      terminal.current?.println(
        "注意：这会将私钥存储在您浏览器的本地存储中",
        TerminalTextStyle.Text
      );
      terminal.current?.println(
        '本地存储相对不安全。我们建议只导入资金为零或零的账户。'
      );
      const newSKey = (await terminal.current?.getInput()) || '';
      try {
        const newAddr = address(utils.computeAddress(newSKey));

        addAccount(newSKey);

        ethConnection?.setAccount(newSKey);
        terminal.current?.println(`带地址的导入帐户 ${newAddr}.`);
        setStep(TerminalPromptStep.ACCOUNT_SET);
      } catch (e) {
        terminal.current?.println(
          '出现未知错误。请再试一次。',
          TerminalTextStyle.Red
        );
      }
    },
    [ethConnection]
  );

  const advanceStateFromAccountSet = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      try {
        const playerAddress = ethConnection?.getAddress();
        if (!playerAddress || !ethConnection) throw new Error('未登录');

        const whitelist = await ethConnection.loadContract<DarkForest>(
          contractAddress,
          loadDiamondContract
        );
        const isWhitelisted = await whitelist.isWhitelisted(playerAddress);
        // TODO(#2329): isWhitelisted should just check the contractOwner
        const adminAddress = address(await whitelist.adminAddress());

        terminal.current?.println('');
        terminal.current?.print('检查是否列入白名单...');

        // TODO(#2329): isWhitelisted should just check the contractOwner
        if (isWhitelisted || playerAddress === adminAddress) {
          terminal.current?.println('已列入白名单。');
          terminal.current?.println('');
          terminal.current?.println(`欢迎，玩家 ${playerAddress}.`);
          // TODO: Provide own env variable for this feature
          if (!isProd) {
            // in development, automatically get some ether from faucet
            const balance = weiToEth(await ethConnection?.loadBalance(playerAddress));
            if (balance === 0) {
              await requestDevFaucet(playerAddress);
            }
          }
          setStep(TerminalPromptStep.FETCHING_ETH_DATA);
        } else {
          setStep(TerminalPromptStep.ASKING_HAS_WHITELIST_KEY);
        }
      } catch (e) {
        console.error(`连接到白名单时出错： ${e}`);
        terminal.current?.println(
          '错误：无法连接到白名单合约。请刷新并在几分钟后重试。',
          TerminalTextStyle.Red
        );
        setStep(TerminalPromptStep.TERMINATED);
      }
    },
    [ethConnection, isProd, contractAddress]
  );

  const advanceStateFromAskHasWhitelistKey = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.print('你有白名单密钥吗?', TerminalTextStyle.Text);
      terminal.current?.println(' (y/n)');
      const userInput = await terminal.current?.getInput();
      if (userInput === 'y') {
        setStep(TerminalPromptStep.ASKING_WHITELIST_KEY);
      } else if (userInput === 'n') {
        setStep(TerminalPromptStep.ASKING_WAITLIST_EMAIL);
      } else {
        terminal.current?.println('无法识别的输入。请再试一次。');
        await advanceStateFromAskHasWhitelistKey(terminal);
      }
    },
    []
  );

  const advanceStateFromAskWhitelistKey = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const address = ethConnection?.getAddress();
      if (!address) throw new Error('未登录');

      terminal.current?.println(
        '请输入您的邀请码（XXXXXX-XXXXXX-XXXXXX-XXXXXX）：',
        TerminalTextStyle.Sub
      );

      const key = (await terminal.current?.getInput()) || '';

      terminal.current?.print('正在处理密钥...（这可能需要长达 30 秒）');
      terminal.current?.newline();

      if (!useZkWhitelist) {
        let registerConfirmationResponse = {} as RegisterConfirmationResponse;
        try {
          registerConfirmationResponse = await callRegisterAndWaitForConfirmation(
            key,
            address,
            terminal
          );
        } catch (e) {
          registerConfirmationResponse = {
            canRetry: true,
            errorMessage:
              '连接到白名单服务器时出错。请稍后再试。',
          };
        }

        if (!registerConfirmationResponse.txHash) {
          terminal.current?.println(
            '错误: ' + registerConfirmationResponse.errorMessage,
            TerminalTextStyle.Red
          );
          if (registerConfirmationResponse.canRetry) {
            terminal.current?.println('按任意键重试。');
            await terminal.current?.getInput();
            advanceStateFromAskWhitelistKey(terminal);
          } else {
            setStep(TerminalPromptStep.ASKING_WAITLIST_EMAIL);
          }
        } else {
          terminal.current?.print('成功加入游戏。 ', TerminalTextStyle.Green);
          terminal.current?.print(`欢迎，玩家`);
          terminal.current?.println(address, TerminalTextStyle.Text);
          terminal.current?.print('发送 $0.15 给玩家 :) ', TerminalTextStyle.Blue);
          terminal.current?.printLink(
            '(查看交易)',
            () => {
              window.open(`${BLOCK_EXPLORER_URL}/${registerConfirmationResponse.txHash}`);
            },
            TerminalTextStyle.Blue
          );
          terminal.current?.newline();
          setStep(TerminalPromptStep.ASKING_PLAYER_EMAIL);
        }
      } else {
        if (!ethConnection) throw new Error('没有 eth 链接');
        const contractsAPI = await makeContractsAPI({ connection: ethConnection, contractAddress });

        const keyBigInt = bigIntFromKey(key);
        const snarkArgs = await getWhitelistArgs(keyBigInt, address, terminal);
        try {
          const ukReceipt = await contractsAPI.contract.useKey(
            snarkArgs[ZKArgIdx.PROOF_A],
            snarkArgs[ZKArgIdx.PROOF_B],
            snarkArgs[ZKArgIdx.PROOF_C],
            [...snarkArgs[ZKArgIdx.DATA]]
          );
          await ukReceipt.wait();
          terminal.current?.print('成功加入游戏。 ', TerminalTextStyle.Green);
          terminal.current?.print(`欢迎，玩家 `);
          terminal.current?.println(address, TerminalTextStyle.Text);
          terminal.current?.print('发送 $0.15 给玩家 :) ', TerminalTextStyle.Blue);
          terminal.current?.printLink(
            '(查看交易)',
            () => {
              window.open(`${BLOCK_EXPLORER_URL}/${ukReceipt.hash}`);
            },
            TerminalTextStyle.Blue
          );
          terminal.current?.newline();
          setStep(TerminalPromptStep.ASKING_PLAYER_EMAIL);
        } catch (e) {
          const error = e.error;
          if (error instanceof Error) {
            const invalidKey = error.message.includes('invalid key');
            if (invalidKey) {
              terminal.current?.println(`错误：键 ${key} 无效.`, TerminalTextStyle.Red);
              setStep(TerminalPromptStep.ASKING_WAITLIST_EMAIL);
            } else {
              terminal.current?.println(`错误：出了点问题.`, TerminalTextStyle.Red);
              terminal.current?.println('按任意键重试.');
              await terminal.current?.getInput();
              advanceStateFromAskWhitelistKey(terminal);
            }
          }
          console.error('错误白名单.');
        }
      }
    },
    [ethConnection, contractAddress, useZkWhitelist]
  );

  const advanceStateFromAskWaitlistEmail = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println(
        '输入您的电子邮件地址以注册白名单.',
        TerminalTextStyle.Text
      );
      const email = (await terminal.current?.getInput()) || '';
      terminal.current?.print('响应待定...');
      const response = await submitInterestedEmail(email);
      if (response === EmailResponse.Success) {
        terminal.current?.println('电子邮件已成功记录。', TerminalTextStyle.Green);
        terminal.current?.println(
          '在接下来的几周内密切关注更新和邀请密钥。按 ENTER 返回主页。',
          TerminalTextStyle.Sub
        );
        setStep(TerminalPromptStep.TERMINATED);
        (await await terminal.current?.getInput()) || '';
        history.push('/');
      } else if (response === EmailResponse.Invalid) {
        terminal.current?.println('电子邮件无效。请再试一次。', TerminalTextStyle.Red);
      } else {
        terminal.current?.print('错误：服务器错误。', TerminalTextStyle.Red);
        terminal.current?.print('按 ENTER 返回主页.', TerminalTextStyle.Sub);
        (await await terminal.current?.getInput()) || '';
        setStep(TerminalPromptStep.TERMINATED);
        history.push('/');
      }
    },
    [history]
  );

  const advanceStateFromAskPlayerEmail = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const address = ethConnection?.getAddress();
      if (!address) throw new Error('未登录');

      terminal.current?.print('输入你的电子邮箱地址。 ', TerminalTextStyle.Text);
      terminal.current?.println("如果您中奖，我们将使用此电子邮件地址通知您。");

      const email = (await terminal.current?.getInput()) || '';
      const response = await submitPlayerEmail(await ethConnection?.signMessageObject({ email }));

      if (response === EmailResponse.Success) {
        terminal.current?.println('电子邮件已成功记录。');
        setStep(TerminalPromptStep.FETCHING_ETH_DATA);
      } else if (response === EmailResponse.Invalid) {
        terminal.current?.println('电子邮件无效.', TerminalTextStyle.Red);
        advanceStateFromAskPlayerEmail(terminal);
      } else {
        terminal.current?.println('记录电子邮件时出错。', TerminalTextStyle.Red);
        setStep(TerminalPromptStep.FETCHING_ETH_DATA);
      }
    },
    [ethConnection]
  );

  const advanceStateFromFetchingEthData = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      let newGameManager: GameManager;

      try {
        if (!ethConnection) throw new Error('没有 eth 链接');

        newGameManager = await GameManager.create({
          connection: ethConnection,
          terminal,
          contractAddress,
        });
      } catch (e) {
        console.error(e);

        setStep(TerminalPromptStep.ERROR);

        terminal.current?.print(
          '网络负载过重。请刷新页面，检查 ',
          TerminalTextStyle.Red
        );

        terminal.current?.printLink(
          'https://blockscout.com/poa/xdai/',
          () => {
            window.open('https://blockscout.com/poa/xdai/');
          },
          TerminalTextStyle.Red
        );

        terminal.current?.println('');

        return;
      }

      setGameManager(newGameManager);

      window.df = newGameManager;

      const newGameUIManager = await GameUIManager.create(newGameManager, terminal);

      window.ui = newGameUIManager;

      terminal.current?.newline();
      terminal.current?.println('连接到黑暗森林合约');
      gameUIManagerRef.current = newGameUIManager;

      if (!newGameManager.hasJoinedGame()) {
        setStep(TerminalPromptStep.NO_HOME_PLANET);
      } else {
        const browserHasData = !!newGameManager.getHomeCoords();
        if (!browserHasData) {
          terminal.current?.println(
            '错误：在此浏览器上找不到家庭坐标。',
            TerminalTextStyle.Red
          );
          setStep(TerminalPromptStep.ASK_ADD_ACCOUNT);
          return;
        }
        terminal.current?.println('验证本地数据...');
        setStep(TerminalPromptStep.ALL_CHECKS_PASS);
      }
    },
    [ethConnection, contractAddress]
  );

  const advanceStateFromAskAddAccount = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println('导入帐户家坐标? (y/n)', TerminalTextStyle.Text);
      terminal.current?.println(
        "如果您要导入帐户，请确保您知道自己在做什么。"
      );
      const userInput = await terminal.current?.getInput();
      if (userInput === 'y') {
        setStep(TerminalPromptStep.ADD_ACCOUNT);
      } else if (userInput === 'n') {
        terminal.current?.println('尝试使用不同的帐户并重新加载。');
        setStep(TerminalPromptStep.TERMINATED);
      } else {
        terminal.current?.println('无法识别的输入。请再试一次。');
        await advanceStateFromAskAddAccount(terminal);
      }
    },
    []
  );

  const advanceStateFromAddAccount = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const gameUIManager = gameUIManagerRef.current;

      if (gameUIManager) {
        try {
          terminal.current?.println('x: ', TerminalTextStyle.Blue);
          const x = parseInt((await terminal.current?.getInput()) || '');
          terminal.current?.println('y: ', TerminalTextStyle.Blue);
          const y = parseInt((await terminal.current?.getInput()) || '');
          if (
            Number.isNaN(x) ||
            Number.isNaN(y) ||
            Math.abs(x) > 2 ** 32 ||
            Math.abs(y) > 2 ** 32
          ) {
            throw '家庭坐标无效.';
          }
          if (await gameUIManager.addAccount({ x, y })) {
            terminal.current?.println('成功添加账号.');
            terminal.current?.println('正在初始化游戏...');
            setStep(TerminalPromptStep.ALL_CHECKS_PASS);
          } else {
            throw '家庭坐标无效.';
          }
        } catch (e) {
          terminal.current?.println(`错误: ${e}`, TerminalTextStyle.Red);
          terminal.current?.println('请再试一次。');
        }
      } else {
        terminal.current?.println('错误：找不到游戏 UI 管理器。终止会话。');
        setStep(TerminalPromptStep.TERMINATED);
      }
    },
    []
  );

  const advanceStateFromNoHomePlanet = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println('欢迎来到黑暗森林。');

      const gameUIManager = gameUIManagerRef.current;
      if (!gameUIManager) {
        terminal.current?.println('错误：找不到游戏 UI 管理器。终止会话。');
        setStep(TerminalPromptStep.TERMINATED);
        return;
      }

      if (Date.now() / 1000 > gameUIManager.getEndTimeSeconds()) {
        terminal.current?.println('错误：这个游戏已经结束。终止会话。');
        setStep(TerminalPromptStep.TERMINATED);
        return;
      }

      terminal.current?.newline();

      terminal.current?.println('我们收集了一组最小的统计数据，例如 SNARK 证明');
      terminal.current?.println('跨浏览器的时间和平均交易时间，以帮助 ');
      terminal.current?.println('我们优化性能并修复错误。你可以选择退出');
      terminal.current?.println('在“设置”窗格中。');
      terminal.current?.println('');

      terminal.current?.newline();

      terminal.current?.println('按 ENTER 键查找母行星。这可能需要长达 120 秒的时间。');
      terminal.current?.println('这会消耗大量的CPU。');

      await terminal.current?.getInput();

      gameUIManager.getGameManager().on(GameManagerEvent.InitializedPlayer, () => {
        setTimeout(() => {
          terminal.current?.println('正在初始化游戏...');
          setStep(TerminalPromptStep.ALL_CHECKS_PASS);
        });
      });

      gameUIManager
        .joinGame(async (e) => {
          console.error(e);

          terminal.current?.println('加入游戏时出错：');
          terminal.current?.println('');
          terminal.current?.println(e.message, TerminalTextStyle.Red);
          terminal.current?.println('');
          terminal.current?.println('按 Enter 重试：');

          await terminal.current?.getInput();
          return true;
        })
        .catch((error: Error) => {
          terminal.current?.println(
            `[错误] 发生错误： ${error.toString().slice(0, 10000)}`,
            TerminalTextStyle.Red
          );
        });
    },
    []
  );

  const advanceStateFromAllChecksPass = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      terminal.current?.println('');
      terminal.current?.println('按 ENTER 开始');
      terminal.current?.println("按“s”然后按 ENTER 以安全模式开始 -禁用插件");

      const input = await terminal.current?.getInput();

      if (input === 's') {
        const gameUIManager = gameUIManagerRef.current;
        gameUIManager?.getGameManager()?.setSafeMode(true);
      }

      setStep(TerminalPromptStep.COMPLETE);
      setInitRenderState(InitRenderState.COMPLETE);
      terminal.current?.clear();

      terminal.current?.println('欢迎来到黑暗森林。', TerminalTextStyle.Green);
      terminal.current?.println('');
      terminal.current?.println(
        "这是 Dark Forest 交互式 JavaScript 终端。仅当您确切地知道自己在做什么时才使用它。"
      );
      terminal.current?.println('');
      terminal.current?.println('尝试运行：df.getAccount()');
      terminal.current?.println('');
    },
    []
  );

  const advanceStateFromComplete = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      const input = (await terminal.current?.getInput()) || '';
      let res = '';
      try {
        // indrect eval call: http://perfectionkills.com/global-eval-what-are-the-options/
        res = (1, eval)(input);
        if (res !== undefined) {
          terminal.current?.println(res.toString(), TerminalTextStyle.Text);
        }
      } catch (e) {
        res = e.message;
        terminal.current?.println(`错误: ${res}`, TerminalTextStyle.Red);
      }
      advanceStateFromComplete(terminal);
    },
    []
  );

  const advanceStateFromError = useCallback(async () => {
    await neverResolves();
  }, []);

  const advanceState = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | undefined>) => {
      if (step === TerminalPromptStep.NONE && ethConnection) {
        await advanceStateFromNone(terminal);
      } else if (step === TerminalPromptStep.COMPATIBILITY_CHECKS_PASSED) {
        await advanceStateFromCompatibilityPassed(terminal);
      } else if (step === TerminalPromptStep.DISPLAY_ACCOUNTS) {
        await advanceStateFromDisplayAccounts(terminal);
      } else if (step === TerminalPromptStep.GENERATE_ACCOUNT) {
        await advanceStateFromGenerateAccount(terminal);
      } else if (step === TerminalPromptStep.IMPORT_ACCOUNT) {
        await advanceStateFromImportAccount(terminal);
      } else if (step === TerminalPromptStep.ACCOUNT_SET) {
        await advanceStateFromAccountSet(terminal);
      } else if (step === TerminalPromptStep.ASKING_HAS_WHITELIST_KEY) {
        await advanceStateFromAskHasWhitelistKey(terminal);
      } else if (step === TerminalPromptStep.ASKING_WHITELIST_KEY) {
        await advanceStateFromAskWhitelistKey(terminal);
      } else if (step === TerminalPromptStep.ASKING_WAITLIST_EMAIL) {
        await advanceStateFromAskWaitlistEmail(terminal);
      } else if (step === TerminalPromptStep.ASKING_PLAYER_EMAIL) {
        await advanceStateFromAskPlayerEmail(terminal);
      } else if (step === TerminalPromptStep.FETCHING_ETH_DATA) {
        await advanceStateFromFetchingEthData(terminal);
      } else if (step === TerminalPromptStep.ASK_ADD_ACCOUNT) {
        await advanceStateFromAskAddAccount(terminal);
      } else if (step === TerminalPromptStep.ADD_ACCOUNT) {
        await advanceStateFromAddAccount(terminal);
      } else if (step === TerminalPromptStep.NO_HOME_PLANET) {
        await advanceStateFromNoHomePlanet(terminal);
      } else if (step === TerminalPromptStep.ALL_CHECKS_PASS) {
        await advanceStateFromAllChecksPass(terminal);
      } else if (step === TerminalPromptStep.COMPLETE) {
        await advanceStateFromComplete(terminal);
      } else if (step === TerminalPromptStep.ERROR) {
        await advanceStateFromError();
      }
    },
    [
      step,
      advanceStateFromAccountSet,
      advanceStateFromAddAccount,
      advanceStateFromAllChecksPass,
      advanceStateFromAskAddAccount,
      advanceStateFromAskHasWhitelistKey,
      advanceStateFromAskPlayerEmail,
      advanceStateFromAskWaitlistEmail,
      advanceStateFromAskWhitelistKey,
      advanceStateFromCompatibilityPassed,
      advanceStateFromComplete,
      advanceStateFromDisplayAccounts,
      advanceStateFromError,
      advanceStateFromFetchingEthData,
      advanceStateFromGenerateAccount,
      advanceStateFromImportAccount,
      advanceStateFromNoHomePlanet,
      advanceStateFromNone,
      ethConnection,
    ]
  );

  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.emit(UIEmitterEvent.UIChange);
  }, [initRenderState]);

  useEffect(() => {
    const gameUiManager = gameUIManagerRef.current;
    if (!terminalVisible && gameUiManager) {
      const tutorialManager = TutorialManager.getInstance(gameUiManager);
      tutorialManager.acceptInput(TutorialState.Terminal);
    }
  }, [terminalVisible]);

  useEffect(() => {
    if (terminalHandle.current && topLevelContainer.current) {
      advanceState(terminalHandle);
    }
  }, [terminalHandle, topLevelContainer, advanceState]);

  return (
    <Wrapper initRender={initRenderState} terminalEnabled={terminalVisible}>
      <GameWindowWrapper initRender={initRenderState} terminalEnabled={terminalVisible}>
        {gameUIManagerRef.current && topLevelContainer.current && gameManager && (
          <TopLevelDivProvider value={topLevelContainer.current}>
            <UIManagerProvider value={gameUIManagerRef.current}>
              <GameWindowLayout
                terminalVisible={terminalVisible}
                setTerminalVisible={setTerminalVisible}
              />
            </UIManagerProvider>
          </TopLevelDivProvider>
        )}
        <TerminalToggler
          terminalEnabled={terminalVisible}
          setTerminalEnabled={setTerminalVisible}
        />
      </GameWindowWrapper>
      <TerminalWrapper initRender={initRenderState} terminalEnabled={terminalVisible}>
        <Terminal ref={terminalHandle} promptCharacter={'$'} />
      </TerminalWrapper>
      <div ref={topLevelContainer}></div>
    </Wrapper>
  );
}
