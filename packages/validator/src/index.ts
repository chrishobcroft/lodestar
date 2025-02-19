/**
 * @module validator
 */

export {Validator, ValidatorOptions} from "./validator";
export {ValidatorStore, SignerType, Signer, SignerLocal, SignerRemote} from "./services/validatorStore";
export {waitForGenesis} from "./genesis";

// Remote signer client
export {externalSignerGetKeys, externalSignerPostSignature, externalSignerUpCheck} from "./util/externalSignerClient";

export * from "./slashingProtection";
export * from "./repositories";
