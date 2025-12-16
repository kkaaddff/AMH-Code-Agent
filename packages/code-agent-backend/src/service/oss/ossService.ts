import axios from 'axios';
import OSS from 'ali-oss';
import { FILE_CDN } from './config';

type TOssStsOptions = {
  stsAccessId: string;
  stsAccessKey: string;
  stsToken: string;
  endpoint: string;
  bucketName: string;
};

type TUploadPrepareInfoDTO = {
  /** 文件名&路径 */
  key: string;
  /** bizType */
  bizType: string;
  /** 是否为私有库图片 */
  confidential: boolean;
  /** 父级目录 */
  bizTypePath: string;
};

export type TBizType = 'explore-biz' | 'fta-snapshot';

export class OssService {
  private client: OSS = null;

  //======================================= 服务初始化 =============================================================
  async init() {
    const { pubOssTokenDTO } = await this.preUpload();
    if (pubOssTokenDTO) {
      this.getOssClient(pubOssTokenDTO);
    }
  }

  constructor(private readonly bizType: TBizType) {
    this.init();
  }

  //======================================= oss 预上传 =============================================================
  private getOssClient(ossToken: TOssStsOptions) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.client = new OSS({
      accessKeyId: ossToken.stsAccessId,
      accessKeySecret: ossToken.stsAccessKey,
      stsToken: ossToken.stsToken,
      endpoint: ossToken.endpoint,
      bucket: ossToken.bucketName,
      refreshSTSToken: async () => {
        // 向您搭建的STS服务获取临时访问凭证。
        const { pubOssTokenDTO } = await that.preUpload();
        return {
          accessKeyId: pubOssTokenDTO.stsAccessId,
          accessKeySecret: pubOssTokenDTO.stsAccessKey,
          stsToken: pubOssTokenDTO.stsToken,
        };
      },
      // 刷新临时访问凭证的时间间隔，单位为毫秒。 公共服务的token有效期为30分钟，这里设置为25分钟刷新
      refreshSTSTokenInterval: 25 * 60 * 1000,
    });
  }

  private async getUploadAccess() {
    const response = await axios.request({
      url: 'https://boss.amh-group.com/ps-admin-app/file/preUpload',
      method: 'post',
      data: {
        pubTokenTimestamp: Date.now() + 1000 * 60 * 5,
        prepare2UploadReqDTOs: [{ bizType: this.bizType, fileCount: 1 }],
      },
    });

    const data = response.data;
    if (data.result === 1) {
      return data;
    }
    throw new Error(data.errorMsg);
  }

  private async preUpload() {
    try {
      const {
        uploadPrepareInfoDTOs,
        pubOssTokenDTO,
      }: {
        uploadPrepareInfoDTOs: TUploadPrepareInfoDTO;
        pubOssTokenDTO: TOssStsOptions;
      } = await this.getUploadAccess();

      return {
        fileInfo: uploadPrepareInfoDTOs,
        pubOssTokenDTO,
      };
    } catch (error) {
      console.log(error);
      return { pubOssTokenDTO: null };
    }
  }

  //======================================= 上传逻辑 =============================================================
  private formatResponse(path: string) {
    const url = `${FILE_CDN}/${path}`;
    const temp = path.split('/');
    const name = temp[temp.length - 1];
    return {
      url,
      path,
      name,
    };
  }

  private async simpleUpload({ file, fileName }) {
    const response = await this.client.put(fileName, file);

    return this.formatResponse(response.name);
  }

  private async doUpload({ file, fileName }: { file: Buffer; fileName: string }) {
    try {
      return this.simpleUpload({ file, fileName });
    } catch (error) {
      return {
        originName: fileName,
        error,
      };
    }
  }

  //====================================================================================================
  public async uploadFile(file: Buffer, fileName: string) {
    return this.doUpload({
      file,
      fileName,
    });
  }
}
