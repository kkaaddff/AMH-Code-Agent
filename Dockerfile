FROM harbor.ymmoa.com/base/phantom-ymm-centos-node-20-19
MAINTAINER Phantom "phantom@amh-group.com"
COPY --chown=ymmapp package.zip /data
COPY ymm_env.sh /etc/profile.d