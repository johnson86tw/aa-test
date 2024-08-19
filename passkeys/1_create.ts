import {
	toPasskeyValidator,
	toWebAuthnKey,
	WebAuthnMode,
	PasskeyValidatorContractVersion,
} from '@zerodev/passkey-validator'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const webAuthnKey = await toWebAuthnKey({
	passkeyName: 'passkey name',
	passkeyServerUrl: 'your passkey server URL',
	mode: WebAuthnMode.Register,
})

const passkeyValidator = await toPasskeyValidator(publicClient, {
	webAuthnKey,
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	kernelVersion: KERNEL_V3_1,
	validatorContractVersion: PasskeyValidatorContractVersion.V0_0_2,
})
