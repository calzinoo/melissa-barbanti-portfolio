// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SmartEditorialLayout from "@/components/public/SmartEditorialLayout";

afterEach(cleanup);

const imgs = (n: number) => Array.from({ length: n }, (_, i) => `/img-${i + 1}.webp`);

describe("<SmartEditorialLayout />", () => {
  it("renders paragraphs and every image exactly once (2 zig-zag + masonry grid)", () => {
    render(<SmartEditorialLayout text={"Uno\n\nDue\n\nTre\n\nQuattro"} images={imgs(5)} alt="Mostra" />);
    for (const t of ["Uno", "Due", "Tre", "Quattro"]) expect(screen.getByText(t)).toBeInTheDocument();
    const rendered = screen.getAllByRole("img").map((i) => i.getAttribute("src"));
    expect(rendered).toEqual(imgs(5));
    // grid images are clickable (lightbox), zig-zag images are not
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("renders nothing visible for empty text and images, without throwing", () => {
    const { container } = render(<SmartEditorialLayout text="" images={[]} />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("long text, no images: text only", () => {
    render(<SmartEditorialLayout text={Array.from({ length: 5 }, (_, i) => `P${i + 1}`).join("\n\n")} images={[]} />);
    expect(screen.getAllByText(/^P\d$/)).toHaveLength(5);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});
