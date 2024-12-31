const erc1155 = {
  abi: [
    {
      "name": "WorldProviderImpl",
      "type": "impl",
      "interface_name": "dojo::world::IWorldProvider"
    },
    {
      "name": "dojo::world::IWorldDispatcher",
      "type": "struct",
      "members": [
        {
          "name": "contract_address",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "name": "dojo::world::IWorldProvider",
      "type": "interface",
      "items": [
        {
          "name": "world",
          "type": "function",
          "inputs": [],
          "outputs": [
            {
              "type": "dojo::world::IWorldDispatcher"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "name": "MintBurnBriqs",
      "type": "impl",
      "interface_name": "briq_protocol::erc::mint_burn::MintBurn"
    },
    {
      "name": "briq_protocol::erc::mint_burn::MintBurn",
      "type": "interface",
      "items": [
        {
          "name": "mint",
          "type": "function",
          "inputs": [
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_id",
              "type": "core::felt252"
            },
            {
              "name": "amount",
              "type": "core::integer::u128"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "burn",
          "type": "function",
          "inputs": [
            {
              "name": "owner",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_id",
              "type": "core::felt252"
            },
            {
              "name": "amount",
              "type": "core::integer::u128"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "name": "ERC1155MetadataImpl",
      "type": "impl",
      "interface_name": "briq_protocol::erc::erc1155::interface::IERC1155Metadata"
    },
    {
      "name": "core::integer::u256",
      "type": "struct",
      "members": [
        {
          "name": "low",
          "type": "core::integer::u128"
        },
        {
          "name": "high",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "name": "briq_protocol::erc::erc1155::interface::IERC1155Metadata",
      "type": "interface",
      "items": [
        {
          "name": "name",
          "type": "function",
          "inputs": [],
          "outputs": [
            {
              "type": "core::felt252"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "symbol",
          "type": "function",
          "inputs": [],
          "outputs": [
            {
              "type": "core::felt252"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "uri",
          "type": "function",
          "inputs": [
            {
              "name": "token_id",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::array::Array::<core::felt252>"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "name": "ERC1155Impl",
      "type": "impl",
      "interface_name": "presets::erc1155::erc1155::interface::IERC1155"
    },
    {
      "name": "core::bool",
      "type": "enum",
      "variants": [
        {
          "name": "False",
          "type": "()"
        },
        {
          "name": "True",
          "type": "()"
        }
      ]
    },
    {
      "name": "presets::erc1155::erc1155::interface::IERC1155",
      "type": "interface",
      "items": [
        {
          "name": "balance_of",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "id",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "balance_of_batch",
          "type": "function",
          "inputs": [
            {
              "name": "accounts",
              "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
            },
            {
              "name": "ids",
              "type": "core::array::Array::<core::integer::u256>"
            }
          ],
          "outputs": [
            {
              "type": "core::array::Array::<core::integer::u256>"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "set_approval_for_all",
          "type": "function",
          "inputs": [
            {
              "name": "operator",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "approved",
              "type": "core::bool"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "is_approved_for_all",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "operator",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "safe_transfer_from",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "to",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "id",
              "type": "core::integer::u256"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            },
            {
              "name": "data",
              "type": "core::array::Array::<core::integer::u8>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "safe_batch_transfer_from",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "to",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "ids",
              "type": "core::array::Array::<core::integer::u256>"
            },
            {
              "name": "amounts",
              "type": "core::array::Array::<core::integer::u256>"
            },
            {
              "name": "data",
              "type": "core::array::Array::<core::integer::u8>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "name": "ERC1155CamelOnlyImpl",
      "type": "impl",
      "interface_name": "presets::erc1155::erc1155::interface::IERC1155CamelOnly"
    },
    {
      "name": "presets::erc1155::erc1155::interface::IERC1155CamelOnly",
      "type": "interface",
      "items": [
        {
          "name": "balanceOf",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "id",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "balanceOfBatch",
          "type": "function",
          "inputs": [
            {
              "name": "accounts",
              "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
            },
            {
              "name": "ids",
              "type": "core::array::Array::<core::integer::u256>"
            }
          ],
          "outputs": [
            {
              "type": "core::array::Array::<core::integer::u256>"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "setApprovalForAll",
          "type": "function",
          "inputs": [
            {
              "name": "operator",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "approved",
              "type": "core::bool"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "isApprovedForAll",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "operator",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "safeTransferFrom",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "to",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "id",
              "type": "core::integer::u256"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            },
            {
              "name": "data",
              "type": "core::array::Array::<core::integer::u8>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "safeBatchTransferFrom",
          "type": "function",
          "inputs": [
            {
              "name": "from",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "to",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "ids",
              "type": "core::array::Array::<core::integer::u256>"
            },
            {
              "name": "amounts",
              "type": "core::array::Array::<core::integer::u256>"
            },
            {
              "name": "data",
              "type": "core::array::Array::<core::integer::u8>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "name": "UpgradableImpl",
      "type": "impl",
      "interface_name": "dojo::components::upgradeable::IUpgradeable"
    },
    {
      "name": "dojo::components::upgradeable::IUpgradeable",
      "type": "interface",
      "items": [
        {
          "name": "upgrade",
          "type": "function",
          "inputs": [
            {
              "name": "new_class_hash",
              "type": "core::starknet::class_hash::ClassHash"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "name": "SupportsERC1155Impl",
      "type": "impl",
      "interface_name": "briq_protocol::supports_interface::ISRC5"
    },
    {
      "name": "briq_protocol::supports_interface::ISRC5",
      "type": "interface",
      "items": [
        {
          "name": "supports_interface",
          "type": "function",
          "inputs": [
            {
              "name": "interface_id",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "name": "SupportsERC1155CamelImpl",
      "type": "impl",
      "interface_name": "briq_protocol::supports_interface::ISRC5Camel"
    },
    {
      "name": "briq_protocol::supports_interface::ISRC5Camel",
      "type": "interface",
      "items": [
        {
          "name": "supportsInterface",
          "type": "function",
          "inputs": [
            {
              "name": "interfaceId",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "name": "dojo_resource",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "type": "core::felt252"
        }
      ],
      "state_mutability": "view"
    },
    {
      "kind": "struct",
      "name": "dojo::components::upgradeable::upgradeable::Upgraded",
      "type": "event",
      "members": [
        {
          "kind": "data",
          "name": "class_hash",
          "type": "core::starknet::class_hash::ClassHash"
        }
      ]
    },
    {
      "kind": "enum",
      "name": "dojo::components::upgradeable::upgradeable::Event",
      "type": "event",
      "variants": [
        {
          "kind": "nested",
          "name": "Upgraded",
          "type": "dojo::components::upgradeable::upgradeable::Upgraded"
        }
      ]
    },
    {
      "kind": "struct",
      "name": "briq_protocol::tokens::briq_token::briq_token::TransferSingle",
      "type": "event",
      "members": [
        {
          "kind": "data",
          "name": "operator",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "from",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "to",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "id",
          "type": "core::integer::u256"
        },
        {
          "kind": "data",
          "name": "value",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "kind": "struct",
      "name": "briq_protocol::tokens::briq_token::briq_token::TransferBatch",
      "type": "event",
      "members": [
        {
          "kind": "data",
          "name": "operator",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "from",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "to",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "ids",
          "type": "core::array::Array::<core::integer::u256>"
        },
        {
          "kind": "data",
          "name": "values",
          "type": "core::array::Array::<core::integer::u256>"
        }
      ]
    },
    {
      "kind": "struct",
      "name": "briq_protocol::tokens::briq_token::briq_token::ApprovalForAll",
      "type": "event",
      "members": [
        {
          "kind": "data",
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "operator",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "kind": "data",
          "name": "approved",
          "type": "core::bool"
        }
      ]
    },
    {
      "kind": "enum",
      "name": "briq_protocol::supports_interface::SupportsERC1155::Event",
      "type": "event",
      "variants": []
    },
    {
      "kind": "enum",
      "name": "briq_protocol::tokens::briq_token::briq_token::Event",
      "type": "event",
      "variants": [
        {
          "kind": "nested",
          "name": "UpgradeableEvent",
          "type": "dojo::components::upgradeable::upgradeable::Event"
        },
        {
          "kind": "nested",
          "name": "TransferSingle",
          "type": "briq_protocol::tokens::briq_token::briq_token::TransferSingle"
        },
        {
          "kind": "nested",
          "name": "TransferBatch",
          "type": "briq_protocol::tokens::briq_token::briq_token::TransferBatch"
        },
        {
          "kind": "nested",
          "name": "ApprovalForAll",
          "type": "briq_protocol::tokens::briq_token::briq_token::ApprovalForAll"
        },
        {
          "kind": "nested",
          "name": "SupportsERC1155Event",
          "type": "briq_protocol::supports_interface::SupportsERC1155::Event"
        }
      ]
    }
  ],
};
export const erc1155Abi = erc1155.abi;
