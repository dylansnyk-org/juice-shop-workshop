import { Component, OnInit, ChangeDetectorRef } from '@angular/core'
import { KeysService } from '../Services/keys.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'
import { TranslateService } from '@ngx-translate/core'
import {
  BeeFaucetABI,
  BeeTokenABI,
  nftABI
} from '../../assets/public/ContractABIs'
import { getDefaultProvider, BrowserProvider, Contract, parseUnits, formatEther } from 'ethers'
import {
  createClient,
  connect,
  disconnect,
  getAccount,
  signMessage,
  InjectedConnector
} from '@wagmi/core'

const client = createClient({
  autoConnect: true,
  provider: getDefaultProvider()
})
const { ethereum } = window

const nftAddress = '0x41427790c94E7a592B17ad694eD9c06A02bb9C39'
const BeeTokenAddress = '0x36435796Ca9be2bf150CE0dECc2D8Fab5C4d6E13'
const BeeFaucetAddress = '0x860e3616aD0E0dEDc23352891f3E10C4131EA5BC'

@Component({
  selector: 'app-faucet',
  templateUrl: './faucet.component.html',
  styleUrls: ['./faucet.component.scss']
})
export class FaucetComponent {
  constructor (
    private readonly keysService: KeysService,
    private readonly snackBarHelperService: SnackBarHelperService,
    private readonly translateService: TranslateService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  userData: object
  session = false
  deployedContractAddress = ''
  BEEBalance = 0
  myBEEBalance = 0
  withdrawAmount: number = null
  successResponse = false
  mintButtonDisabled = true
  challengeSolved = false
  nftMintText = 'Mint the Pot - 1000 BEE'
  errorMessage = ''
  metamaskAddress = ''

  ngOnInit (): void {
    this.translateService.get('NFT_MINT_TEXT_INTRO').subscribe((translatedString: string) => {
      this.nftMintText = translatedString
    })
    this.handleAuth()
    this.checkNftMinted()
    this.nftMintListener()
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))
  }

  nftMintListener () {
    this.keysService.nftMintListen().subscribe(
      (response) => {
        console.log(response)
      },
      (error) => {
        console.error(error)
      }
    )
  }

  checkNftMinted () {
    this.keysService.checkNftMinted().subscribe(
      (response) => {
        const challengeSolvedStatus = response.data[0].solved
        this.mintButtonDisabled = challengeSolvedStatus
        this.challengeSolved = challengeSolvedStatus
        if (challengeSolvedStatus) {
          this.translateService.get('NFT_MINT_TEXT_SUCCESS').subscribe((translatedString: string) => {
            this.nftMintText = translatedString
          })
        }
      },
      (error) => {
        console.error(error)
        this.successResponse = false
      }
    )
  }

  async fetchMyBeeBalance () {
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const contract = new Contract(
        BeeTokenAddress,
        BeeTokenABI,
        signer
      )
      const userAddress = await signer.getAddress()
      const balanceBigInt: bigint = await contract.balanceOf(userAddress)
      console.log(balanceBigInt)
      const WeiPerEther = 10n ** 18n
      this.myBEEBalance = Number(balanceBigInt / WeiPerEther)
      if (this.myBEEBalance >= 1000 && !this.challengeSolved) {
        this.mintButtonDisabled = false
      }
      if (this.myBEEBalance <= 1000 && !this.challengeSolved) {
        this.mintButtonDisabled = true
      }
    } catch (error) {
      console.error('Error fetching BEE balance:', error)
    }
  }

  async fetchBeeBalance () {
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const contract = new Contract(
        BeeFaucetAddress,
        BeeFaucetABI,
        signer
      )
      const balance = await contract.balance()
      console.log(balance)
      this.BEEBalance = balance
    } catch (error) {
      console.error('Error fetching BEE balance:', error)
    }
  }

  async handleChainChanged (chainId: string) {
    await this.handleAuth()
  }

  async handleAuth () {
    try {
      const { isConnected } = getAccount()

      if (isConnected) {
        await disconnect()
      }
      if (!window.ethereum) {
        this.snackBarHelperService.open('PLEASE_INSTALL_WEB3_WALLET', 'errorBar')
        return
      }

      const provider = await connect({ connector: new InjectedConnector() })
      this.metamaskAddress = provider.account
      this.userData = {
        address: provider.account,
        chain: provider.chain.id,
        network: 'evm'
      }
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }
        ]
      })
      const targetChainId = '11155111'
      const currentChainId = String(provider.chain?.id)

      if (provider && currentChainId !== targetChainId) {
        this.session = false
        this.snackBarHelperService.open('PLEASE_CONNECT_TO_SEPOLIA_NETWORK', 'errorBar')
      } else {
        console.log('Should show ethereum chain now')
        this.session = true
        await this.fetchBeeBalance()
        await this.fetchMyBeeBalance()
      }
      console.log('session', this.session)
      this.changeDetectorRef.detectChanges()
    } catch (err) {
      console.log(err)
    }
  }

  async extractBEETokens (amount = this.withdrawAmount) {
    if (!this.session) {
      this.snackBarHelperService.open('PLEASE_CONNECT_WEB3_WALLET', 'errorBar')
      return
    }
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      const balanceBigInt = await provider.getBalance(userAddress)

      const balanceEth = formatEther(balanceBigInt)

      console.log('ETH balance:', balanceEth, typeof balanceEth)
      if (balanceEth < '0.001') {
        this.errorMessage = 'Deposit some test ETH from sepoliafaucet.com or any other ETH faucet to initiate transaction.'
        return
      }
      const contract = new Contract(
        BeeFaucetAddress,
        BeeFaucetABI,
        signer
      )
      const tx = await contract.withdraw(amount)
      await tx.wait()

      console.log('BEE tokens extracted successfully')
      this.fetchBeeBalance()
      this.fetchMyBeeBalance()
    } catch (error) {
      console.error('Error extracting BEEs:', error.message)
      this.errorMessage = error.message
    }
  }

  async mintNFT () {
    if (!this.session) {
      this.snackBarHelperService.open('PLEASE_CONNECT_WEB3_WALLET', 'errorBar')
      return
    }
    this.translateService.get('NFT_MINT_TEXT_AWAITING_APPROVAL').subscribe((translatedString: string) => {
      this.nftMintText = translatedString
    })
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const amountToApprove = parseUnits('1000', 18)
      const BeeTokenContract = new Contract(
        BeeTokenAddress,
        BeeTokenABI,
        signer
      )
      const approvalTx = await BeeTokenContract.approve(
        nftAddress,
        amountToApprove
      )

      await approvalTx.wait()
      this.translateService.get('NFT_MINT_TEXT_CONFIRM').subscribe((translatedString: string) => {
        this.nftMintText = translatedString
      })

      const contract = new Contract(nftAddress, nftABI, signer)

      const transaction = await contract.mintNFT()
      console.log(transaction)
      this.translateService.get('NFT_MINT_TEXT_IN_PROGRESS').subscribe((translatedString: string) => {
        this.nftMintText = translatedString
      })

      const mintConfirmation = await transaction.wait()
      console.log(mintConfirmation)
      if (mintConfirmation) {
        this.translateService.get('NFT_MINT_TEXT_SUCCESS').subscribe((translatedString: string) => {
          this.nftMintText = translatedString
        })
        setTimeout(() => {
          this.keysService.verifyNFTWallet(this.metamaskAddress).subscribe(
            (response) => {
              if (response.success) {
                this.successResponse = response.status
                this.mintButtonDisabled = true
              }
            },
            (error) => {
              console.error(error)
              this.successResponse = false
            }
          )
        }, 3500)
      }

      console.log('NFT minted successfully!')
    } catch (error) {
      console.error('Error minting NFT:', error)
    }
  }

  async signOut () {
    await disconnect()
    this.session = false
  }
}
