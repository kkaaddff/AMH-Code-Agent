import React from 'react';
import { Modal, Typography, Divider, Tag } from 'antd';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;

interface InteractionGuideOverlayProps {
  open: boolean;
  onClose: () => void;
}

const InteractionGuideOverlay: React.FC<InteractionGuideOverlayProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="知道了"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={860}
      centered
      title="交互引导"
      className={styles.modalRoot}
    >
      <div className={styles.container}>
        <section className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            快捷键操作
          </Title>
          <Paragraph className={styles.sectionParagraph}>
            在属性面板中可使用快捷键快速完成标注的创建与删除操作，提升标注效率。
          </Paragraph>

          <div className={styles.shortcutList}>
            <div className={styles.shortcutItem}>
              <div className={styles.shortcutKeys}>
                <Text keyboard>⌘ / Ctrl</Text>
                <Text className={styles.shortcutPlus}>+</Text>
                <Text keyboard>Enter</Text>
              </div>
              <div className={styles.shortcutDesc}>
                <Text strong>创建标注</Text>
                <Text type="secondary" className={styles.shortcutSubtext}>
                  选中 DSL 节点或多选后，快速创建 FTA 组件标注
                </Text>
              </div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.shortcutKeys}>
                <Text keyboard>⌘ / Ctrl</Text>
                <Text className={styles.shortcutPlus}>+</Text>
                <Text keyboard>Delete</Text>
              </div>
              <div className={styles.shortcutDesc}>
                <Text strong>删除标注</Text>

                <Text type="secondary" className={styles.shortcutSubtext}>
                  删除选中的标注（根节点不可删除）
                </Text>
              </div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.shortcutKeys}>
                <Text keyboard>Esc</Text>
              </div>
              <div className={styles.shortcutDesc}>
                <Text strong>清空选中</Text>

                <Text type="secondary" className={styles.shortcutSubtext}>
                  取消所有选中的节点
                </Text>
              </div>
            </div>
          </div>
        </section>
        <Divider className={styles.divider} />
        <section className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            画布基础操作
          </Title>
          <Paragraph className={styles.sectionParagraph}>
            单击任意区域可切换选中，悬停时呈现高亮描边。使用
            <Text keyboard>Ctrl / ⌘</Text>
            可在不丢失当前上下文的情况下追加或剔除节点；
            <Text keyboard>Esc</Text>
            可随时清空选中。
          </Paragraph>
          <div className={styles.sceneRow}>
            <div className={styles.scene}>
              <div className={`${styles.node} ${styles.nodeSmall}`} style={{ left: 24, top: 26 }} />
              <div className={`${styles.node} ${styles.nodeLarge}`} style={{ left: 76, top: 22 }} />
              <div className={`${styles.node} ${styles.nodeMedium}`} style={{ left: 58, top: 74 }} />
              <div className={`${styles.pulseRing} ${styles.pulsePrimary}`} />
              <div className={`${styles.cursor} ${styles.cursorPrimary}`} />
            </div>
            <div className={styles.sceneCaption}>悬停时描边与标签保持同步；命中标注优先于 DSL 节点。</div>
          </div>
        </section>

        <Divider className={styles.divider} />

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={5} className={styles.sectionTitle}>
              多选与层级处理
            </Title>
            <Tag color="blue" className={styles.sectionTag}>
              Ctrl / ⌘ + 点击
            </Tag>
          </div>
          <Paragraph className={styles.sectionParagraph}>
            图层之间存在父子约束：当父节点加入选中集时，会自动剔除已选中的子节点；尝试添加子节点时若父节点已被选中，则保持父节点不变，避免重复标注。
          </Paragraph>
          <div className={styles.sceneRow}>
            <div className={styles.scene}>
              <div className={`${styles.node} ${styles.nodeLarge}`} style={{ left: 28, top: 24 }} />
              <div className={`${styles.node} ${styles.nodeMedium}`} style={{ left: 48, top: 44 }} />
              <div className={`${styles.node} ${styles.nodeSmall}`} style={{ left: 104, top: 60 }} />
              <div className={`${styles.selectionHalo} ${styles.selectionHaloPrimary}`} />
              <div className={`${styles.selectionHalo} ${styles.selectionHaloSecondary}`} />
            </div>
            <div className={styles.sceneCaption}>
              追加父节点后，蓝色高亮覆盖全区域，子节点高亮淡出，表示由父级接管选中。
            </div>
          </div>
        </section>

        <Divider className={styles.divider} />

        <section className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            Shift 框选 · 正交 vs 反交
          </Title>
          <Paragraph className={styles.sectionParagraph}>
            框选统一由
            <Text keyboard>Shift</Text>+ 拖拽触发。框体方向决定命中规则：
            <Text strong> 正交（从左向右）</Text>
            需要完全包裹目标；
            <Text strong> 反交（从右向左）</Text>
            只要与框体相交即可。
          </Paragraph>

          <div className={styles.dualScenes}>
            <div className={styles.sceneColumn}>
              <div className={styles.sceneLabel}>
                正交框选
                <Tag color="processing" className={styles.sectionTag}>
                  L → R
                </Tag>
              </div>
              <div className={styles.scene}>
                <div className={`${styles.node} ${styles.nodeSmall}`} style={{ left: 26, top: 30 }} />
                <div className={`${styles.node} ${styles.nodeMedium}`} style={{ left: 82, top: 26 }} />
                <div className={`${styles.node} ${styles.nodeTall}`} style={{ left: 54, top: 74 }} />
                <div className={styles.selectionBoxLTR} />
                <div className={`${styles.selectionPing} ${styles.selectionPingBlue}`} style={{ left: 34, top: 38 }} />
                <div className={`${styles.selectionPing} ${styles.selectionPingBlue}`} style={{ left: 110, top: 38 }} />
              </div>
              <div className={styles.sceneCaption}>框体完成时仅保留完全落入范围的节点，高亮呈蓝色。</div>
            </div>

            <div className={styles.sceneColumn}>
              <div className={styles.sceneLabel}>
                反交框选
                <Tag color="success" className={styles.sectionTag}>
                  R → L
                </Tag>
              </div>
              <div className={styles.scene}>
                <div className={`${styles.node} ${styles.nodeSmall}`} style={{ left: 26, top: 24 }} />
                <div className={`${styles.node} ${styles.nodeWide}`} style={{ left: 72, top: 30 }} />
                <div className={`${styles.node} ${styles.nodeTall}`} style={{ left: 56, top: 76 }} />
                <div className={styles.selectionBoxRTL} />
                <div
                  className={`${styles.selectionPing} ${styles.selectionPingGreen}`}
                  style={{ left: 108, top: 38 }}
                />
                <div className={`${styles.selectionPing} ${styles.selectionPingGreen}`} style={{ left: 60, top: 96 }} />
              </div>
              <div className={styles.sceneCaption}>绿色框向左回扫，所有被碰触的节点都会加入选中。</div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default InteractionGuideOverlay;
