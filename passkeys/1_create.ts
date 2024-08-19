import {
	toPasskeyValidator,
	toWebAuthnKey,
	WebAuthnMode,
	PasskeyValidatorContractVersion,
} from '@zerodev/passkey-validator'
import { createKernelAccount } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { createPublicClient, http } from 'viem'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`
const PASSKEY_SERVER_URL = `https://passkeys.zerodev.app/api/v3/${PROJECT_ID}`

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const webAuthnKey = await toWebAuthnKey({
	passkeyName: 'passkey aa',
	passkeyServerUrl: PASSKEY_SERVER_URL,
	mode: WebAuthnMode.Register,
	passkeyServerHeaders: {},
})

const publicClient = createPublicClient({
	transport: http(BUNDLER_RPC),
})

const passkeyValidator = await toPasskeyValidator(publicClient, {
	webAuthnKey,
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	kernelVersion: KERNEL_V3_1,
	validatorContractVersion: PasskeyValidatorContractVersion.V0_0_2,
})

const account = await createKernelAccount(publicClient, {
	plugins: {
		sudo: passkeyValidator,
	},
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	kernelVersion: KERNEL_V3_1,
})

console.log('account', account.address)
