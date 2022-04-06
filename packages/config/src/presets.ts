import {createIChainForkConfig} from "./beaconConfig.js";
import {chainConfig as mainnetChainConfig} from "./chainConfig/presets/mainnet.js";
import {chainConfig as minimalChainConfig} from "./chainConfig/presets/minimal.js";

export {mainnetChainConfig, minimalChainConfig};
// for testing purpose only
export const mainnet = createIChainForkConfig(mainnetChainConfig);
export const minimal = createIChainForkConfig(minimalChainConfig);
