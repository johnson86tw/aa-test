import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { signerToSimpleSmartAccount } from 'permissionless/accounts'
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import 'dotenv/config'

/**
 * tutorial: https://docs.pimlico.io/permissionless/how-to/accounts/use-simple-account#how-to-create-and-use-a-simpleaccount-with-permissionlessjs
 * 這段程式碼會部署 AA 合約然後送交易，但會因為 balance 不足，第二筆交易會失敗。
 */

export const publicClient = createPublicClient({
	transport: http('https://rpc.ankr.com/eth_sepolia'),
})

const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY as string

if (!PRIVATE_KEY || !PIMLICO_API_KEY) {
	throw new Error('Please set your private key in a .env file')
}

const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
	signer: privateKeyToAccount(`0x${PRIVATE_KEY}`),
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	factoryAddress: '0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985',
})

export const paymasterClient = createPimlicoPaymasterClient({
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
})

export const pimlicoBundlerClient = createPimlicoBundlerClient({
	transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
	entryPoint: ENTRYPOINT_ADDRESS_V07,
})

const smartAccountClient = createSmartAccountClient({
	account: simpleAccount,
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	chain: sepolia,
	bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
	middleware: {
		sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
		gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast, // if using pimlico bundler
	},
})

const txHash = await smartAccountClient.sendTransaction({
	to: '0x96A4715280c3Dac3F3093d51aA278aA5eb60ffDE',
	value: parseEther('0.1'),
})

console.log(txHash)
