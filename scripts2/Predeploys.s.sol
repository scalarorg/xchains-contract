
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Predeploys
/// @notice Contains constant addresses for contracts that are pre-deployed to the OP Stack L2 system.
library Predeploys {
    /// @notice Address of the GATEWAY predeploy.
    address internal constant GATEWAY_ADDRESS = 0x2bb588d7bb6faAA93f656C3C78fFc1bEAfd1813D;

    /// @notice Address of the Gas Services predeploy.
    address internal constant GAS_SERVICES = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

}