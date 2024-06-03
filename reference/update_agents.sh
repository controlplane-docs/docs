#!/bin/bash


## WIP - DO NOT EXECUTE



# execute the following before running: cpln profile update default --org demo-cpln-organization

GENERATE=(agent auditctx cloudaccount domain group gvc identity image location org policy quota secret serviceaccount user workload)

for x in ${GENERATE[@]};
do 

    echo $x
    FILE="$x.mdx"
    PERMS=$(cpln $x permissions -o json)
    OUTPUT="| Permission | Description | Implies |\n| - | - | - |\n"

    while read i; do

        NAME=$(echo "$i" | jq -r '.name')
        DESC=$(echo "$i" | jq -r '.description' | sed "s@\/@\\\/@")
        IMPLIES=""

        while read j; do
            IMPLIES+="$j, "
        done <<<$(echo "$PERMS" | jq -cr ".implied.$NAME[]?" )

        OUTPUT+="| $NAME | $DESC | ${IMPLIES::-2} |\n"

    done <<<$(echo "$PERMS" | jq -cr '.items[]')

    # echo "$OUTPUT"

    sed -Ezi "s/(<!-- PERMISSIONS-START -->.*<!-- PERMISSIONS-END -->)/<!-- PERMISSIONS-START -->\n$OUTPUT<!-- PERMISSIONS-END -->/" $FILE

done



