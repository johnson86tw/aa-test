import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { addressToEmptyAccount, createKernelAccount } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { http, createPublicClient, type Address, type PrivateKeyAccount } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { toECDSASigner } from '@zerodev/permissions/signers'
import { toSudoPolicy } from '@zerodev/permissions/policies'
import { serializePermissionAccount, toPermissionValidator } from '@zerodev/permissions'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const SESSION_PRIVATE_KEY = process.env.SESSION_PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY || !SESSION_PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`

const entryPoint = ENTRYPOINT_ADDRESS_V07
const kernelVersion = KERNEL_V3_1

const publicClient = createPublicClient({
	transport: http(BUNDLER_RPC),
})

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)

const main = async () => {
	const sessionKeyAddress = '0x1A31EC4Ee4C8381dC3dd2E85EBD756619BB30576'
	console.log('sessionKeyAddress', sessionKeyAddress)

	// The signer approves the session key by signing its address and sending back the signature
	const approval = await getApproval(signer, sessionKeyAddress)
	console.log('approval', approval)

	fs.writeFile(path.join(__dirname, 'approval.json'), JSON.stringify({ approval }, null, 2), err => {
		if (err) {
			console.error('Error writing file', err)
		} else {
			console.log('Successfully wrote file')
		}
	})
}

main()

async function getApproval(signer: PrivateKeyAccount, sessionKeyAddress: Address) {
	const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
		entryPoint,
		signer,
		kernelVersion,
	})

	// Create an "empty account" as the signer -- you only need the public
	// key (address) to do this.
	const emptyAccount = addressToEmptyAccount(sessionKeyAddress)
	const emptySessionKeySigner = toECDSASigner({ signer: emptyAccount })

	const permissionPlugin = await toPermissionValidator(publicClient, {
		entryPoint,
		signer: emptySessionKeySigner,
		policies: [
			// In this example, we are just using a sudo policy to allow everything.
			// In practice, you would want to set more restrictive policies.
			toSudoPolicy({}),
		],
		kernelVersion,
	})

	const sessionKeyAccount = await createKernelAccount(publicClient, {
		entryPoint,
		plugins: {
			sudo: ecdsaValidator,
			regular: permissionPlugin,
		},
		kernelVersion,
	})

	return await serializePermissionAccount(sessionKeyAccount)
}
