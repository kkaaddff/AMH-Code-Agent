```markdown
# ImageUpload 图片上传

图片上传至 OSS。

Thresh 端已支持调用 `Taro.previewImage`。

## 说明

### 使用说明
- 音视频上传/预览功能仅限在站内使用。
- V1.7.3 版本下线 `ali-oss` SDK，支持微信小程序图片/视频上传。
- 如果提示缺少请求中间件，请在页面上方添加导入：`import 'src/api/request'`。

### 端差异
- 支付宝小程序内嵌 H5 时，需安装 `alipay-formdata` 依赖，并通过 `import 'alipay-formdata'` 引入，否则 iOS 端无法上传文件。

## 引用

```ts
// 推荐独立使用
import ImageUpload from '@fta/image-upload-legacy'
```

```ts
// 不推荐
import { ImageUpload } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { scale, withLayer } from '@fta/components';
import { DemoBlock, Layout } from '@fta/components/common/display';
import ImageUpload from '@fta/image-upload-legacy';
import React, { useEffect, useState } from 'react';
import initRequest from '../../../tools/utils/initRequest/request';
import './index.scss';

initRequest();

const ImageUploadDemo = () => {
  const [images, setImages] = useState<string[]>([
    'ymmfile/user-pub/c13279b3-2ad8-40b1-bbea-92248da400d0',
  ]);
  const [imgKeys, setImgKeys] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => {
      // 模拟异步设置图片 key
      // setImgKeys(['ymmfile/ltlline/7af4fbac-0f54-46f8-83f1-3ef8a3c84fea']);
    }, 3000);
  }, []);

  return (
    <Layout title='图片上传' qrcode='components/form/image-upload/index'>
      <DemoBlock label='上传图片-三等分'>
        <ImageUpload
          value={images}
          bizType='user-pub'
          maxCount={9}
          onChange={(keys) => {
            console.log('onChange', keys);
            setImages(keys);
          }}
          env='dev'
          title='满满上传'
          column={3}
          mediaType={5}
          plusActionProps={{
            style: { backgroundColor: '#fefefe' },
          }}
          deleteIconSize={32}
          onRequestDelete={(action) => {
            console.log('onRequestDelete');
            action();
            return false;
          }}
          deletable={({ key }) => key.slice(0, 4) !== 'http'}
        />
      </DemoBlock>

      <DemoBlock label='上传图片-四等分'>
        <ImageUpload
          value={imgKeys}
          bizType='ltlline'
          useLocalPreview
          maxCount={9}
          onChange={(v) => {
            setImgKeys(v);
          }}
          env='dev'
          column={4}
        />
      </DemoBlock>

      <DemoBlock label='上传图片-自定义尺寸'>
        <ImageUpload
          value={imgKeys}
          itemStyle={{ width: scale(310) }}
          bizType='ltlline'
          maxCount={9}
          onChange={(v) => {
            setImgKeys(v);
          }}
          env='dev'
          column={2}
        />
      </DemoBlock>

      <DemoBlock label='只读模式(V1.2.0)'>
        <ImageUpload
          readonly
          value={[
            'https://imagecdn.ymm56.com/ymmfile/static/resource/6f678bda-ab5a-49e8-83ba-1b6f19c0beb7.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/83b10e1c-66b8-4d08-b7d0-9cbec8c8a43d.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/fc6a0c01-f022-4dcd-941c-2c6c77fe4a30.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/b752bbb7-ed30-4757-b535-23ac3b06345f.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/2d1579d9-654d-43be-91ae-2814c9c49a9f.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/fb95c991-e7b4-40ea-a8c6-c156c8ce1b3d.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/4385772d-7b30-45ff-8b4a-3690df0565a3.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/70b6d868-844a-4362-b209-a9560c940da2.png',
            'https://imagecdn.ymm56.com/ymmfile/static/resource/edbb11ab-49be-4885-8c1d-c40959bb290f.png',
          ]}
          bizType='ltlline'
          maxCount={9}
          env='prod'
          column={4}
        />
      </DemoBlock>
    </Layout>
  );
};

export default withLayer(ImageUploadDemo, {
  id: 'sheet_page',
});
```

### 业务场景示例

```tsx
import { Button, Flex, scale, ActionSheet, ActionSheetItem as Item, withLayer } from '@fta/components';
import { DemoBlock, Layout } from '@fta/components/common/display';
import ImageUpload from '@fta/image-upload-legacy';
import { Image } from '@tarojs/components';
import React, { useEffect, useState } from 'react';
import initRequest from '../../../tools/utils/initRequest/request';
import { DevTool } from '@thresh/thresh-lib';
import { Text, View } from '@tarojs/components';
import './index.scss';

initRequest();

const ImageUploadDemo = () => {
  const [images, setImages] = useState<string[]>([]);
  const [singleKey, setSingleKey] = useState<string[]>([]);
  const [imgKeys, setImgKeys] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => {
      // 模拟异步加载
    }, 3000);
  }, []);

  return (
    <Layout title='图片上传' qrcode='components/form/image-upload/index'>
      <DemoBlock label='上传证件'>
        <ImageUpload
          onClickUpload={() => {
            return true; // 返回 false 将阻断上传
          }}
          value={images}
          bizType='user-pub'
          maxCount={1}
          onChange={(v) => {
            setImgKeys(v);
          }}
          env='dev'
          column={3}
        >
          <Image
            style={{ width: '100%', height: '100%' }}
            src='https://imagecdn.ymm56.com/ymmfile/static/resource/e4c0dec7-5727-4472-b6ab-5eacd752da82.png'
          />
        </ImageUpload>
      </DemoBlock>

      <DemoBlock label='自定义单张上传'>
        <ImageUpload
          value={singleKey}
          bizType='user-pub'
          maxCount={1}
          onChange={setSingleKey}
          env='dev'
          column={3}
          renderItemSuffix={(_, { upload }) => {
            return (
              <Flex.Center
                style={{
                  position: 'absolute',
                  right: 0,
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 1,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}
              >
                <Button size='small' onClick={upload}>
                  更换
                </Button>
              </Flex.Center>
            );
          }}
        />
      </DemoBlock>

      <DemoBlock label='上传图片-自定义上传行为'>
        <ImageUpload
          value={images}
          bizType='user-pub'
          maxCount={9}
          onChange={(keys) => {
            setImages(keys);
          }}
          env='dev'
          title='满满上传'
          column={3}
          mediaType={5}
          plusActionProps={{
            style: { backgroundColor: '#fefefe' },
          }}
          deleteIconSize={32}
          onAfterChoose={(keys) => {
            // 可用于加水印等处理
            return keys;
          }}
          onCustomUpload={async (actions) => {
            const LayerContext = {
              key: 'sheet_1',
              id: 'sheet_page',
            };
            const hide = () => ActionSheet.hide(LayerContext);

            ActionSheet.show({
              ...LayerContext,
              useNativeModal: true,
              clickOverlayOnClose: true,
              onClose: hide,
              example: (
                <View className='demo-action-sheet-example'>
                  <Text className='demo-action-sheet-example__text'>示例</Text>
                  <View className='demo-action-sheet-example__content'>
                    <Text className='demo-action-sheet-example__content__text'>内容</Text>
                    <Text className='demo-action-sheet-example__content__text'>根据需求自定义设计</Text>
                  </View>
                </View>
              ),
              children: (
                <>
                  <Item onClick={() => {
                    actions.chooseImageFromCamera();
                    hide();
                  }}>拍照</Item>
                  <Item onClick={() => {
                    actions.chooseImageFromAlbum();
                    hide();
                  }}>相册</Item>
                  <View className='diy-item'>
                    <Text className='diy-item__text' onClick={hide}>取消</Text>
                  </View>
                </>
              ),
            });
          }}
          onDeleteCancel={(i) => {
            DevTool.log('onDeleteCancel', i);
          }}
          onDelete={() => {
            DevTool.log('onDelete');
          }}
        />
      </DemoBlock>
    </Layout>
  );
};

export default withLayer(ImageUploadDemo, {
  id: 'sheet_page',
});
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|-------|------|------|--------|------|
| value | 已上传的图片 OSS key 列表 | `string[]` | `--` | |
| bizType | 存储桶（必选） | `string` | `(必选)` | |
| column | 列数，支持 `2`、`3`、`4` | `2 \| 3 \| 4` | `3` | |
| maxCount | 最大可上传数量 | `number` | `9` | |
| env | 环境：`dev`、`qa`、`prod`（必选） | `"dev" \| "qa" \| "prod"` | `(必选)` | |
| options | Bridge 选取图片时的参数 | `{ size?: number; maxBytes?: number; ... }` | `--` | 1.1.1 |
| previewable | 是否默认点击预览图片 | `boolean` | `true` | 1.1.3 |
| children | 自定义上传 Item 的样式 | `ReactNode` | `--` | |
| readonly | 是否只读模式（图片预览） | `boolean` | `false` | 1.2.0 |
| title | 上传照片的标题 | `ReactNode` | `"上传照片"` | 1.2.2 |
| mediaType | 上传文件格式：1-照片，2-视频，3-视频和照片，4-音频，5-全部 | `1 \| 2 \| 3 \| 4 \| 5` | `1` | 1.2.3 |
| mode | 图片展示裁剪方式 | `string \| number` | `--` | 1.2.3 |
| confirmColor | 弹窗确认按钮颜色 | `string` | `"#ff7000"` | 1.2.3 |
| audioPoster | 音频封面图 | `string` | `--` | 1.2.3 |
| imageResolution | 缩略图分辨率 | `number` | `800` | 1.3.2 |
| useLocalPreview | 使用本地图片预览（仅站内环境） | `boolean` | `false` | 1.3.3 |
| loadingText | loading 标题 | `string` | `"加载中..."` | 1.4.0 |
| gap | item 间水平和垂直间距 | `{ x: number; y: number }` | `{x:24,y:24}` | 1.4.1 |
| plain | 只读模式下不处理 URL | `boolean` | `false` | 1.4.1 |
| showAfterChange | 是否等待 onChange 后再展示 | `boolean` | `false` | 1.7.14 |
| renderErrorItem | 图片预览失败时渲染的视图 | `(item: { index: number; refresh: () => void }) => ReactNode` | `--` | |
| renderItemPrefix | 渲染每个 item 的前缀节点 | `(index: number, action: { upload: () => void }) => ReactNode` | `--` | 1.2.3 |
| renderItemSuffix | 渲染每个 item 的后缀节点 | `(index: number, action: { upload: () => void }) => ReactNode` | `--` | 1.2.3 |
| deletable | 是否显示删除按钮 | `(image: { index: number; key: string }) => boolean` | `--` | |
| deleteIconSize | 删除图标大小 | `number` | `40` | 1.9.0 |
| itemClassName | item 自定义类名 | `string` | `--` | 1.2.4 |
| itemStyle | item 自定义样式 | `object` | `--` | 1.2.4 |
| itemBgColor | item 背景颜色 | `string` | `--` | |
| plusActionProps | 上传格子节点属性透传 | `object` | `--` | |
| chooseOptions | 选择图片的配置 | `object` | `--` | 1.9.0 |
| prefix | 前缀节点 | `ReactNode` | `--` | |
| suffix | 后缀节点 | `ReactNode` | `--` | |
| previewHandler | 自定义预览操作 | `{ previewImage: async (options: any) => void }` | `--` | 1.8.3 |
| disableLoading | 是否禁用 Loading | `boolean` | `false` | 0.0.9 |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onChange | value 变化时调用 | `(value: string[]) => void \| Promise<void>` | |
| onRequestDelete | 点击删除时的回调，返回 `false` 可自定义删除行为 | `(action: () => void, index: number) => boolean` | 1.2.2 |
| onClickUpload | 点击上传时调用，返回 `false` 阻止上传 | `(e: any) => any` | |
| onClickPreview | 点击预览时调用 | `(e: any) => void` | |
| onDelete | 点击删除确定后调用 | `(i: number) => void` | |
| onDeleteCancel | 点击删除取消后调用 | `(i: number) => void` | 0.0.12 |
| onBeforeChoose | 选取图片前的回调，reject 可阻断上传 | `async (event: any) => any` | 1.1.13 |
| onAfterChoose | 选取图片后回调（可用于加水印） | `(filePaths: T) => T \| Promise<T>` | 1.9.1 |
| onCustomUpload | 自定义上传行为 | `async (actions: { chooseImageFromCamera: () => void; chooseImageFromAlbum: () => void }) => void` | 0.0.12 |
```