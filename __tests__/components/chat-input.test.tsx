import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "@/components/chat/chat-input";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("ChatInput", () => {
  it("submits the current draft once when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <TooltipProvider>
        <ChatInput
          value=""
          onSubmit={onSubmit}
          isLoading={false}
        />
      </TooltipProvider>
    );

    const input = screen.getByLabelText("Chat message input");
    await user.type(input, "Research VAT obligations{enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Research VAT obligations", "chat");
  });

  it("does not submit while loading is active", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <TooltipProvider>
        <ChatInput
          value="Draft an NDA"
          onSubmit={onSubmit}
          isLoading
        />
      </TooltipProvider>
    );

    const input = screen.getByLabelText("Chat message input");
    await user.click(input);
    await user.keyboard("{enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
