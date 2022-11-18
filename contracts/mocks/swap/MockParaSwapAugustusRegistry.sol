// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IParaSwapAugustusRegistry} from "../../adapters/paraswap/interfaces/IParaSwapAugustusRegistry.sol";

contract MockParaSwapAugustusRegistry is IParaSwapAugustusRegistry {
    address immutable AUGUSTUS;

    constructor(address augustus) {
        AUGUSTUS = augustus;
    }

    function isValidAugustus(address augustus) external view override returns (bool) {
        return augustus == AUGUSTUS;
    }
}
