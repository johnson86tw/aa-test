import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { signerToSimpleSmartAccount } from 'permissionless/accounts'
import { createPublicClient, http } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

/**
 * tutorial: https://docs.pimlico.io/permissionless/how-to/accounts/use-simple-account#how-to-create-and-use-a-simpleaccount-with-permissionlessjs
 * 這段程式碼不會部署 AA 合約
 */

const privateKey = generatePrivateKey()

console.log('privateKey', privateKey)

export const signer = privateKeyToAccount(privateKey)
export const publicClient = createPublicClient({
	transport: http('https://rpc.ankr.com/eth_sepolia'),
})

const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
	signer: privateKeyToAccount(privateKey),
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	factoryAddress: '0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985',
})

console.log('simpleAccount', simpleAccount.address)
console.log('simpleAccount', simpleAccount)
