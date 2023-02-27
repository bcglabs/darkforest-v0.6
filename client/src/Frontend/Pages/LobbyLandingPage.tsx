import { EthConnection, ThrottledConcurrentQueue, weiToEth } from '@darkforest_eth/network';
import { address } from '@darkforest_eth/serde';
import { EthAddress } from '@darkforest_eth/types';
import { utils, Wallet } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import { addAccount, getAccounts } from '../../Backend/Network/AccountManager';
import { getEthConnection } from '../../Backend/Network/Blockchain';
import { InitRenderState, TerminalWrapper } from '../Components/GameLandingPageComponents';
import { MythicLabelText } from '../Components/Labels/MythicLabel';
import { TextPreview } from '../Components/TextPreview';
import { TerminalTextStyle } from '../Utils/TerminalTypes';
import { DarkForestTips } from '../Views/DarkForestTips';
import { Terminal, TerminalHandle } from '../Views/Terminal';

class LobbyPageTerminal {
  private ethConnection: EthConnection;
  private terminal: TerminalHandle;
  private accountSet: (account: EthAddress) => void;
  private balancesEth: number[];

  public constructor(
    ethConnection: EthConnection,
    terminal: TerminalHandle,
    accountSet: (account: EthAddress) => void
  ) {
    this.ethConnection = ethConnection;
    this.terminal = terminal;
    this.accountSet = accountSet;
  }

  private async loadBalances(addresses: EthAddress[]) {
    const queue = new ThrottledConcurrentQueue({
      invocationIntervalMs: 1000,
      maxInvocationsPerIntervalMs: 25,
    });

    const balances = await Promise.all(
      addresses.map((address) => queue.add(() => this.ethConnection.loadBalance(address)))
    );

    this.balancesEth = balances.map(weiToEth);
  }

  public async chooseAccount() {
    this.terminal.printElement(<MythicLabelText text='                  创建一个大厅' />);
    this.terminal.newline();
    this.terminal.newline();
    this.terminal.printElement(<DarkForestTips tips={lobbyTips} title='大堂贴士' />);
    this.terminal.newline();

    const accounts = getAccounts();
    this.terminal.println(` 此设备上成立 ${accounts.length}个帐户。正在加载余额...`);
    this.terminal.newline();

    try {
      await this.loadBalances(accounts.map((a) => a.address));
    } catch (e) {
      console.log(e);
      this.terminal.println(
        `加载余额时出错。重新加载页面以重试。`,
        TerminalTextStyle.Red
      );
      return;
    }

    this.terminal.println(`登录以创建大厅。我们建议使用一个帐户`);
    this.terminal.println(`拥有至少 0.25 xDAI。`);
    this.terminal.newline();

    if (accounts.length > 0) {
      this.terminal.print('(a) ', TerminalTextStyle.Sub);
      this.terminal.println('使用现有帐户登录。');
    }

    this.terminal.print('(n) ', TerminalTextStyle.Sub);
    this.terminal.println(`生成新的 Burner 钱包帐户。`);
    this.terminal.print('(i) ', TerminalTextStyle.Sub);
    this.terminal.println(`导入私钥。`);
    this.terminal.println(``);
    this.terminal.println(`选择一个选项：`, TerminalTextStyle.Text);

    const userInput = await this.terminal.getInput();
    if (userInput === 'a' && accounts.length > 0) {
      this.displayAccounts();
    } else if (userInput === 'n') {
      this.generateAccount();
    } else if (userInput === 'i') {
      this.importAccount();
    } else {
      this.terminal.println('无法识别的输入。请再试一次。', TerminalTextStyle.Red);
      this.terminal.println('');
      await this.chooseAccount();
    }
  }

  private async displayAccounts() {
    this.terminal.println(``);
    const accounts = getAccounts();
    for (let i = 0; i < accounts.length; i += 1) {
      this.terminal.print(`(${i + 1}): `, TerminalTextStyle.Sub);
      this.terminal.print(`${accounts[i].address} `);

      if (this.balancesEth[i] < 0.25) {
        this.terminal.println(this.balancesEth[i].toFixed(2) + ' xDAI', TerminalTextStyle.Red);
      } else {
        this.terminal.println(this.balancesEth[i].toFixed(2) + ' xDAI', TerminalTextStyle.Green);
      }
    }
    this.terminal.println(``);
    this.terminal.println(`选择一个帐户：`, TerminalTextStyle.Text);

    const selection = +((await this.terminal.getInput()) || '');
    if (isNaN(selection) || selection > accounts.length) {
      this.terminal.println('无法识别的输入。请再试一次。', TerminalTextStyle.Red);
      await this.displayAccounts();
    } else if (this.balancesEth[selection - 1] < 0.25) {
      this.terminal.println('xDAI 不够。选择另一个帐户。', TerminalTextStyle.Red);
      await this.displayAccounts();
    } else {
      const account = accounts[selection - 1];
      try {
        await this.ethConnection.setAccount(account.privateKey);
        this.accountSet(account.address);
      } catch (e) {
        this.terminal.println(
          '出现未知错误。请再试一次。',
          TerminalTextStyle.Red
        );
        this.terminal.println('');
        this.displayAccounts();
      }
    }
  }

  private async generateAccount() {
    const newWallet = Wallet.createRandom();
    const newSKey = newWallet.privateKey;
    const newAddr = address(newWallet.address);
    try {
      addAccount(newSKey);
      this.ethConnection.setAccount(newSKey);

      this.terminal.println(``);
      this.terminal.print(`使用地址创建新的 Burner 钱包`);
      this.terminal.printElement(<TextPreview text={newAddr} unFocusedWidth={'100px'} />);
      this.terminal.println(``);
      this.terminal.println('');
      this.terminal.println(
        'Noteburner 钱包存储在本地存储中.',
        TerminalTextStyle.Text
      );
      this.terminal.println('他们相对不安全，你应该避免');
      this.terminal.println('在其中存储大量资金。');
      this.terminal.println('');
      this.terminal.println('此外，清除浏览器本地存储/缓存将呈现您的');
      this.terminal.println('Burner 钱包无法访问，除非您导出您的私钥。');
      this.terminal.println('');
      this.terminal.println('按任意键继续：', TerminalTextStyle.Text);

      await this.terminal.getInput();
      this.accountSet(newAddr);
    } catch (e) {
      console.log(e);
      this.terminal.println('出现未知错误。请再试一次。', TerminalTextStyle.Red);
    }
  }

  private async importAccount() {
    this.terminal.println(
      '输入您要导入的帐户的 0x 前缀私钥',
      TerminalTextStyle.Text
    );
    this.terminal.println(
      "注意：这会将私钥存储在您浏览器的本地存储中",
      TerminalTextStyle.Text
    );
    this.terminal.println(
      '本地存储相对不安全。我们建议只导入资金为零或零的账户。'
    );
    const newSKey = (await this.terminal.getInput()) || '';
    try {
      const newAddr = address(utils.computeAddress(newSKey));

      addAccount(newSKey);

      this.ethConnection.setAccount(newSKey);
      this.terminal.println(`带地址的导入帐户 ${newAddr}.`);
      this.accountSet(newAddr);
    } catch (e) {
      this.terminal.println('出现未知错误。请再试一次。', TerminalTextStyle.Red);
      this.terminal.println('');
      this.importAccount();
    }
  }
}

export function LobbyLandingPage({ onReady }: { onReady: (connection: EthConnection) => void }) {
  const terminal = useRef<TerminalHandle>();
  const [connection, setConnection] = useState<EthConnection | undefined>();
  const [controller, setController] = useState<LobbyPageTerminal | undefined>();

  useEffect(() => {
    getEthConnection()
      .then((connection) => setConnection(connection))
      .catch((e) => {
        alert('连接到区块链时出错');
        console.log(e);
      });
  }, []);

  useEffect(() => {
    if (!controller && connection && terminal.current) {
      const newController = new LobbyPageTerminal(
        connection,
        terminal.current,
        (account: EthAddress) => {
          if (connection) {
            terminal.current?.println(`用帐户创建大厅: ${account}`);
            onReady(connection);
          } else {
            alert('无法连接到区块链');
          }
        }
      );
      newController.chooseAccount();
      setController(newController);
    }
  }, [terminal, connection, controller, onReady]);

  return (
    <TerminalWrapper initRender={InitRenderState.NONE} terminalEnabled={false}>
      <Terminal ref={terminal} promptCharacter={'$'} />
    </TerminalWrapper>
  );
}

const lobbyTips = [
  '大厅是一个黑暗森林宇宙，由创建它的帐户控制。',
  '创建大厅时，您可以自定义黑暗森林的大部分方面。',
  '镜像 X 或 Y 空间类型以获得可靠的中性地图。',
  '固定世界半径可用于 1v1 战斗。',
  '尝试提高游戏速度以进行快速回合。',
  '使用 Admin Controls 插件对您的大厅进行上帝模式控制。',
  '您可以通过调整玩家生成柏林范围在任何空间类型中生成',
  '禁用 ZK 以超快地挖掘宇宙。警告：不安全。',
  "不喜欢太空垃圾？禁用它！",
  "不喜欢捕捉区？禁用它们！",
  '更改 Planet Hash Key 以更改行星所在的位置。将其视为行星生成的种子。',
  '更改空间类型键以改变大厅中的空间类型区域。',
  // TODO: link to the blog post
  // TODO: link to Jordan's video
];
