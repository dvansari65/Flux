/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/escrowlayer.json`.
 */
export type Escrowlayer = {
    "address": "ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad";
    "metadata": {
        "name": "escrowlayer";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "grabIntent";
            "discriminator": [
                219,
                20,
                195,
                127,
                167,
                127,
                74,
                110
            ];
            "accounts": [
                {
                    "name": "maker";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "order";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    111,
                                    114,
                                    100,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "maker";
                            },
                            {
                                "kind": "arg";
                                "path": "args.nonce";
                            }
                        ];
                    };
                },
                {
                    "name": "vault";
                    "docs": [
                        "Per-intent token vault PDA — holds locked tokens",
                        "seeds include nonce so each intent gets its own vault"
                    ];
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "maker";
                            },
                            {
                                "kind": "arg";
                                "path": "args.nonce";
                            }
                        ];
                    };
                },
                {
                    "name": "inputMint";
                },
                {
                    "name": "makerTokenAccount";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "args";
                    "type": {
                        "defined": {
                            "name": "grabIntentArgs";
                        };
                    };
                }
            ];
        },
        {
            "name": "placeBid";
            "discriminator": [
                238,
                77,
                148,
                91,
                200,
                151,
                92,
                146
            ];
            "accounts": [
                {
                    "name": "maker";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "order";
                    "writable": true;
                },
                {
                    "name": "inputMint";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "bidPrice";
                    "type": "u64";
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "order";
            "discriminator": [
                134,
                173,
                223,
                185,
                77,
                86,
                28,
                51
            ];
        }
    ];
    "events": [
        {
            "name": "intentCreated";
            "discriminator": [
                184,
                46,
                156,
                205,
                169,
                254,
                11,
                108
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "invalidRequest";
            "msg": "Invalid Request";
        },
        {
            "code": 6001;
            "name": "deadlineInPast";
            "msg": "Deadline passed!";
        },
        {
            "code": 6002;
            "name": "zeroAmount";
            "msg": "zero amount!";
        },
        {
            "code": 6003;
            "name": "auctionExpired";
            "msg": "Auction expired! Try again!";
        },
        {
            "code": 6004;
            "name": "invalidInput";
            "msg": "Bid Price must be greater than 0";
        },
        {
            "code": 6005;
            "name": "invalidAmount";
            "msg": "User expects much more amount , Please bid using higher amount!";
        }
    ];
    "types": [
        {
            "name": "grabIntentArgs";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "inputMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "outputMint";
                        "type": "string";
                    },
                    {
                        "name": "inputAmount";
                        "type": "u64";
                    },
                    {
                        "name": "minOutputAmount";
                        "type": "u64";
                    },
                    {
                        "name": "destinationChain";
                        "type": "u16";
                    },
                    {
                        "name": "recipient";
                        "type": "string";
                    },
                    {
                        "name": "deadline";
                        "type": "i64";
                    },
                    {
                        "name": "nonce";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "intentCreated";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "order";
                        "type": "pubkey";
                    },
                    {
                        "name": "maker";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "destinationChain";
                        "type": "u16";
                    },
                    {
                        "name": "nonce";
                        "type": "u64";
                    },
                    {
                        "name": "outputMint";
                        "type": "string";
                    },
                    {
                        "name": "inputMint";
                        "type": "pubkey";
                    },
                    {
                        "name": "minOutputAmount";
                        "docs": [
                            "Minimum acceptable output"
                        ];
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "order";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "maker";
                        "docs": [
                            "User who created intent"
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "inputMint";
                        "docs": [
                            "SPL token mint being deposited"
                        ];
                        "type": "pubkey";
                    },
                    {
                        "name": "outputMint";
                        "type": "string";
                    },
                    {
                        "name": "inputAmount";
                        "docs": [
                            "Amount locked in escrow"
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "minOutputAmount";
                        "docs": [
                            "Minimum acceptable output"
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "destinationChain";
                        "docs": [
                            "Destination chain identifier"
                        ];
                        "type": "u16";
                    },
                    {
                        "name": "recipient";
                        "docs": [
                            "Recipient on destination chain"
                        ];
                        "type": "string";
                    },
                    {
                        "name": "nonce";
                        "docs": [
                            "Unique replay protection"
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "deadline";
                        "docs": [
                            "Order expiration"
                        ];
                        "type": "i64";
                    },
                    {
                        "name": "solver";
                        "docs": [
                            "Winning solver (optional initially)"
                        ];
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "status";
                        "docs": [
                            "Current lifecycle state"
                        ];
                        "type": {
                            "defined": {
                                "name": "orderStatus";
                            };
                        };
                    },
                    {
                        "name": "createdAt";
                        "docs": [
                            "Creation timestamp"
                        ];
                        "type": "i64";
                    },
                    {
                        "name": "orderBump";
                        "type": "u8";
                    },
                    {
                        "name": "vaultBump";
                        "type": "u8";
                    },
                    {
                        "name": "currentBestBid";
                        "type": "u64";
                    },
                    {
                        "name": "auctionEndIn";
                        "type": "i64";
                    },
                    {
                        "name": "bidCount";
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "orderStatus";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "created";
                    },
                    {
                        "name": "auctionRunning";
                    },
                    {
                        "name": "fulfilled";
                    },
                    {
                        "name": "settled";
                    },
                    {
                        "name": "cancelled";
                    }
                ];
            };
        }
    ];
};
