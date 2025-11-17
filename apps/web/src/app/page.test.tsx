import { render, screen } from '@testing-library/react'
import Page from './page'

describe('Home Page', () => {
  it('renders the main component', () => {
    render(<Page />)

    // Look for the correct text from the new Next.js template
    const heading = screen.getByText(/To get started, edit the page.tsx file./i)
    expect(heading).toBeInTheDocument()
  })
})
