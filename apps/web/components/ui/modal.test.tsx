import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './modal'

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="测试 Modal">
        <p>内容</p>
      </Modal>,
    )
    expect(screen.getByText('测试 Modal')).toBeInTheDocument()
    expect(screen.getByText('内容')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="隐藏">
        <p>内容</p>
      </Modal>,
    )
    expect(screen.queryByText('隐藏')).not.toBeInTheDocument()
    expect(screen.queryByText('内容')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="关闭测试">
        <p>x</p>
      </Modal>,
    )
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders description when provided', () => {
    render(
      <Modal open onClose={vi.fn()} title="标题" description="描述文字">
        <p>内容</p>
      </Modal>,
    )
    expect(screen.getByText('描述文字')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <Modal open onClose={vi.fn()} title="标题" footer={<button>确认</button>}>
        <p>内容</p>
      </Modal>,
    )
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument()
  })
})
