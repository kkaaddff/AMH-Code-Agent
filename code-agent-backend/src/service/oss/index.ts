import { Autoload, Init, Singleton } from '@midwayjs/decorator';
import { OssService, TBizType } from './ossService';

type TOssServiceMap = Map<TBizType, OssService>;

@Autoload()
@Singleton()
export class OssManagement {
  private ossServices: TOssServiceMap = new Map();

  @Init()
  async init() {
    this.ossServices.set('explore-biz', new OssService('explore-biz'));
    this.ossServices.set('fta-snapshot', new OssService('fta-snapshot'));
  }

  // 暂时使用无锁设计，后续如果有并发问题再考虑加锁 （await notify）
  public getOssService(bizType: TBizType) {
    return this.ossServices.get(bizType);
  }
}
