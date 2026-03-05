# to anyone reading this: this shit will deploy to server named "sc0" thats my serchat main prod server. so change the "sc0" here for your liking
# also yes.. it goes through backend server because no static.catfla.re server :p

scp ../releases.tar.xz sc0:/root/Rolling/backend/
ssh sc0 "~/deploy-all.sh"