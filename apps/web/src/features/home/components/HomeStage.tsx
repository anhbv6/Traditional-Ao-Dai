import type { ReactNode } from 'react';
import { homeStageElementId, type HomeStageId } from '../constants/homeStages';

/**
 * Bọc một khối trang chủ để thanh tiến trình (HomeStageNav) nhận biết và cuộn tới được.
 * scroll-mt-20: chừa đúng chiều cao header dính (h-20) khi cuộn tới khối.
 */
export function HomeStage({ id, children }: { id: HomeStageId; children: ReactNode }) {
  return (
    <div id={homeStageElementId(id)} data-home-stage={id} className="scroll-mt-20">
      {children}
    </div>
  );
}
