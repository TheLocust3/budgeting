# engine tests

These files in this subfolder contain the original tests for engine related resources. At one point, the engine was its own microservice and directly managed transactions/rules/accounts/materialization. Now, the engine remains only as a library for the materialization of transactions and the validation of rules.  

As a result, these files test a bunch of features which don't really make a ton of sense. However, there are a few valuable tests around materialization, conflicts, and rule validation. I've done the bare minimum to keep all of these tests functioning, but we should essentially consider these tests deprecated. 
