import { Setting } from '@darkforest_eth/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TutorialManager, {
  TutorialManagerEvent,
  TutorialState,
} from '../../Backend/GameLogic/TutorialManager';
import { Hook } from '../../_types/global/GlobalTypes';
import { Btn } from '../Components/Btn';
import { Underline } from '../Components/CoreUI';
import { Icon, IconType } from '../Components/Icons';
import { White } from '../Components/Text';
import dfstyles from '../Styles/dfstyles';
import { useUIManager } from '../Utils/AppHooks';
import { useBooleanSetting } from '../Utils/SettingsHooks';

function TutorialPaneContent({ tutorialState }: { tutorialState: TutorialState }) {
  const uiManager = useUIManager();
  const tutorialManager = TutorialManager.getInstance(uiManager);

  if (tutorialState === TutorialState.None) {
    return (
      <div className='tutintro'>
        欢迎来到宇宙 <White>黑暗森林</White>. 你想玩这个教程吗?
        <div>
          <Btn className='btn' onClick={() => tutorialManager.acceptInput(TutorialState.None)}>
            是
          </Btn>
          <Btn className='btn' onClick={() => tutorialManager.complete()}>
            否
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.HomePlanet) {
    return (
      <div>
        欢迎来到宇宙。你已经在你的母星星云中初始化了 50 能量.
        <br />
        <br />
        <White>单击您的母星以了解更多信息.</White>
      </div>
    );
  } else if (tutorialState === TutorialState.SendFleet) {
    return (
      <div>
        做得好！在 Selected Planet 窗格中，您将看到有关您所在星球的更多信息。这
        窗格显示有关您的星球的快速信息以及发送资源的能力.
        <br />
        <br />
        <White>尝试向另一个星球发送能量。</White> 您可以单击并拖动以寻找
        其他行星.
      </div>
    );
  } else if (tutorialState === TutorialState.SpaceJunk) {
    return (
      <div>
        当你向行星发送能量时，你积累了一些<White>宇宙垃圾</White>. 发送中
        没有人移动到的行星的能量会给你带来垃圾。你不被允许
        承担超过最大限制的垃圾，将无法采取行动.
        <br />
        <br />
        查看屏幕顶部以查看当前和最大{' '}
        <White>宇宙垃圾</White>.
        <div>
          <Btn className='btn' onClick={() => tutorialManager.acceptInput(TutorialState.SpaceJunk)}>
            下一个
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.Spaceship) {
    return (
      <div>
        您还可以控制几艘太空船 -检查您的母星！你可以移动宇宙飞船
        在任何两个行星之间，即使您不拥有源行星或目标行星。空间
        船只可以移动任何距离！{' '}
        <White>现在尝试将您拥有的宇宙飞船移动到另一个星球!</White>
      </div>
    );
  } else if (tutorialState === TutorialState.Deselect) {
    return (
      <div>
        恭喜，您已向 xDAI 提交迁移！内存池中的移动显示为虚线
        线。接受的移动显示为实线.
        <br />
        <br />
        <White>现在尝试取消选择行星。单击空白区域以取消选择。</White>
      </div>
    );
  } else if (tutorialState === TutorialState.ZoomOut) {
    return (
      <div className='tutzoom'>
        伟大的！您会注意到大部分宇宙都显示为灰色。你需要探索那些
        区域，然后才能查看它们。
        <br />
        <br />
        你会注意到一个目标 <Icon type={IconType.Target} /> 指示你目前所在的位置
        探索。 <White>看到后按下一步。</White> 也可以用鼠标缩放车轮.
        <div>
          <Btn className='btn' onClick={() => tutorialManager.acceptInput(TutorialState.ZoomOut)}>
            下一个
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.MinerMove) {
    return (
      <div>
        未选择任何内容时，您可以使用左下角的上下文菜单移动资源管理器.
        <br />
        <br />
        <White>
          尝试通过单击移动来移动您的资源管理器 <Icon type={IconType.Target} /> 按钮
        </White>
        , 然后点击空间中的某处.
      </div>
    );
  } else if (tutorialState === TutorialState.MinerPause) {
    return (
      <div>
        伟大的！您还可以通过单击暂停 <Icon type={IconType.Pause} />{' '} 来暂停资源管理器
        按钮.
        <br />
        <br />
        <White>现在尝试暂停您的资源管理器.</White>
      </div>
    );
  } else if (tutorialState === TutorialState.Terminal) {
    return (
      <div>
        您可以通过单击左侧边缘来隐藏右侧的终端。
        <br />
        <br />
        <White>现在尝试隐藏终端.</White>
      </div>
    );
  } else if (tutorialState === TutorialState.HowToGetScore) {
    return (
      <div className='tutzoom'>
        <White>这是一场垃圾战争!</White> <br />
        <br />
        在回合结束时获得最高分即可获胜！
        <br />
        <div>
          <Btn
            className='btn'
            onClick={() => tutorialManager.acceptInput(TutorialState.HowToGetScore)}
          >
            下一个
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.ScoringDetails) {
    return (
      <div className='tutzoom'>
        您可以通过时空裂缝提取银币来提高分数，并通过寻找
        文物。神器越稀有，它给你的积分就越多！你也可以增加你的
        通过捕获区得分。将鼠标悬停在顶部栏中的“捕获区”部分以获取更多信息
        关于捕获区.
        <div>
          <Btn
            className='btn'
            onClick={() => tutorialManager.acceptInput(TutorialState.ScoringDetails)}
          >
            下一个
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.Valhalla) {
    return (
      <div className='tutalmost'>
        黑暗森林v0.6.x每一轮的获胜者将获得奖品，并被添加到e{' '}
        <Underline>瓦尔哈拉</Underline> 宇宙.
        <br />
        <br />
        获得最高分才能获胜 (^:
        <div>
          <Btn className='btn' onClick={() => tutorialManager.acceptInput(TutorialState.Valhalla)}>
            下一个
          </Btn>
        </div>
      </div>
    );
  } else if (tutorialState === TutorialState.AlmostCompleted) {
    return (
      <div className='tutalmost'>
        本教程到此结束。出去探索宇宙吧！更多信息将会弹出
        在 <White>右上方</White> 当你发现更多关于游戏的信息时.
        <br />
        我们希望您喜欢黑暗森林！
        <div>
          <Btn className='btn' onClick={() => tutorialManager.complete()}>
            结束
          </Btn>
        </div>
      </div>
    );
  } else {
    return <> </>;
  }
}

const StyledTutorialPane = styled.div<{ visible: boolean }>`
  display: ${({ visible }) => (visible ? 'block' : 'none')};
  position: absolute;
  top: 0;
  left: 0;

  background: ${dfstyles.colors.backgroundlighter};
  color: ${dfstyles.colors.text};
  padding: 8px;
  border-bottom: 1px solid ${dfstyles.colors.border};
  border-right: 1px solid ${dfstyles.colors.border};

  width: 24em;
  height: fit-content;

  z-index: 10;

  & .tutintro {
    & > div:last-child {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      margin-top: 1em;
    }
  }

  & .tutzoom,
  & .tutalmost {
    & > div:last-child {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin-top: 1em;
    }
  }
`;

export function TutorialPane({ tutorialHook }: { tutorialHook: Hook<boolean> }) {
  const uiManager = useUIManager();
  const tutorialManager = TutorialManager.getInstance(uiManager);

  const [tutorialState, setTutorialState] = useState<TutorialState>(TutorialState.None);
  const [tutorialOpen] = tutorialHook;
  const [completed, setCompleted] = useBooleanSetting(uiManager, Setting.TutorialCompleted);

  // sync tutorial state
  useEffect(() => {
    const update = (newState: TutorialState) => {
      setTutorialState(newState);
      setCompleted(newState === TutorialState.Completed);
    };
    tutorialManager.on(TutorialManagerEvent.StateChanged, update);

    return () => {
      tutorialManager.removeListener(TutorialManagerEvent.StateChanged, update);
    };
  }, [tutorialManager, setCompleted]);

  return (
    <StyledTutorialPane visible={!completed && tutorialOpen}>
      <TutorialPaneContent tutorialState={tutorialState} />
    </StyledTutorialPane>
  );
}
