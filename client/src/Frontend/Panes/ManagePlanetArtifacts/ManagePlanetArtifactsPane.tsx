import { isLocatable } from '@darkforest_eth/gamelogic';
import { LocationId } from '@darkforest_eth/types';
import React from 'react';
import { CenterBackgroundSubtext, Underline } from '../../Components/CoreUI';
import { useAccount, useMyArtifactsList, usePlanet, useUIManager } from '../../Utils/AppHooks';
import { useEmitterValue } from '../../Utils/EmitterHooks';
import { ModalHandle } from '../../Views/ModalPane';
import { ManageArtifactsPane } from './ManageArtifacts';

export function PlanetInfoHelpContent() {
  return (
    <div>
      <p>Metadata related to this planet.</p>
    </div>
  );
}

export function ManagePlanetArtifactsHelpContent() {
  return (
    <div>
      <p>
        使用此窗格，您可以专门管理这个星球上的工件。你可以
        一次激活一个神器。一些神器在之后有冷却时间
        停用期间他们不能被激活。
      </p>
      <br />
      <p>
        如果你的星球是 <Underline>时空撕裂</Underline>, 您也可以取款和存款
        文物。当您提取工件时，它会作为 ERC 721 转移到您的地址
        令牌。
      </p>
    </div>
  );
}

/**
 * This is the place where a user can manage all of their artifacts on a
 * particular planet. This includes prospecting, withdrawing, depositing,
 * activating, and deactivating artifacts.
 */
export function ManagePlanetArtifactsPane({
  initialPlanetId,
  modal,
}: {
  initialPlanetId: LocationId | undefined;
  modal: ModalHandle;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const planetId = useEmitterValue(uiManager.selectedPlanetId$, initialPlanetId);
  const planet = usePlanet(uiManager, planetId).value;
  const myArtifacts = useMyArtifactsList(uiManager);
  const onPlanet = uiManager.getArtifactsWithIds(planet?.heldArtifactIds || []);

  const artifactsInWallet = [];
  for (const a of myArtifacts) {
    if (!a.onPlanetId) {
      artifactsInWallet.push(a);
    }
  }

  if (planet && myArtifacts && isLocatable(planet) && account) {
    return (
      <ManageArtifactsPane
        artifactsInWallet={artifactsInWallet}
        artifactsOnPlanet={onPlanet}
        planet={planet}
        playerAddress={account}
        modal={modal}
      />
    );
  } else {
    return (
      <CenterBackgroundSubtext width='100%' height='75px'>
        选择一个星球
      </CenterBackgroundSubtext>
    );
  }
}
