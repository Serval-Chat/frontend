ssh sc0 "rm releases.tar.xz"
scp ../releases.tar.xz sc0:/root/
ssh sc0 "~/deploy-all.sh"