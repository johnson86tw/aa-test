import 'dotenv/config'
import {
	addressToEmptyAccount,
	createKernelAccount,
	createKernelAccountClient,
	createZeroDevPaymasterClient,
} from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { http, createPublicClient, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { toECDSASigner } from '@zerodev/permissions/signers'
import { toSudoPolicy } from '@zerodev/permissions/policies'
import { toPermissionValidator } from '@zerodev/permissions'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`

const entryPoint = ENTRYPOINT_ADDRESS_V07

const publicClient = createPublicClient({
	transport: http(BUNDLER_RPC),
})

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)

const main = async () => {
	const revokeSessionKeyAddress = '0x1A31EC4Ee4C8381dC3dd2E85EBD756619BB30576'
	console.log('revokeSessionKeyAddress', revokeSessionKeyAddress)

	await revokeSessionKey(revokeSessionKeyAddress)

	console.log('Session key revoked')
}

main()

async function revokeSessionKey(sessionKeyAddress: Address) {
	const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
		entryPoint,
		signer,
		kernelVersion: KERNEL_V3_1,
	})
	const sudoAccount = await createKernelAccount(publicClient, {
		plugins: {
			sudo: ecdsaValidator,
		},
		entryPoint,
		kernelVersion: KERNEL_V3_1,
	})

	const kernelPaymaster = createZeroDevPaymasterClient({
		entryPoint,
		chain: sepolia,
		transport: http(PAYMASTER_RPC),
	})
	const sudoKernelClient = createKernelAccountClient({
		entryPoint,
		account: sudoAccount,
		chain: sepolia,
		bundlerTransport: http(BUNDLER_RPC),
		middleware: {
			sponsorUserOperation: kernelPaymaster.sponsorUserOperation,
		},
	})

	const emptyAccount = addressToEmptyAccount(sessionKeyAddress)
	const emptySessionKeySigner = await toECDSASigner({ signer: emptyAccount })

	const permissionPlugin = await toPermissionValidator(publicClient, {
		entryPoint,
		signer: emptySessionKeySigner,
		policies: [
			// In this example, we are just using a sudo policy to allow everything.
			// In practice, you would want to set more restrictive policies.
			toSudoPolicy({}),
		],
		kernelVersion: KERNEL_V3_1,
	})

	const unInstallTxHash = await sudoKernelClient.uninstallPlugin({
		plugin: permissionPlugin,
	})
	console.log({ unInstallTxHash })
}
