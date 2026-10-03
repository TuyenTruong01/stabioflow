# Security boundaries

Stabio Flow does not store private keys, seed phrases, or mnemonics. Milestone 1 uses browser wallet permissions only to request accounts and switch network. It does not sign or submit transactions.

Unattended execution is explicitly deferred until a documented permission model is selected. Any future design must constrain permitted contracts, source and target assets, maximum amount per execution, maximum total spend, expiration, and maximum slippage.
