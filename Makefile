include .env

.PHONY: deploy-sepolia
deploy-sepolia:
	forge script scripts2/Deploy.s.sol:Deploy --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --etherscan-api-key $(ETHERSCAN_API_KEY) --verify -vvvv

.PHONY: verify-wallet
verify-wallet:
	@echo "Verifying wallet address..."
	@forge create --private-key $(PRIVATE_KEY) --dry-run | grep "Deployer"

.PHONY: deploy
deploy:
	@echo "Deploying contracts to $(LOCAL_RPC_URL)"
	@echo "Private key: $(PRIVATE_KEY)"
	forge script scripts2/Deploy.s.sol:Deploy --rpc-url $(LOCAL_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast -vvvv
