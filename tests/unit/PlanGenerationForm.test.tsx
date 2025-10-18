import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { PlanGenerationForm } from "@/components/PlanGenerationForm";
import type { GenerateMealPlanCommand } from "@/types";

// Test wrapper component that provides real react-hook-form context
function TestWrapper({
  onSubmit,
  isLoading = false,
  defaultValues,
}: {
  onSubmit: (data: GenerateMealPlanCommand) => void;
  isLoading?: boolean;
  defaultValues?: Partial<GenerateMealPlanCommand>;
}) {
  const form = useForm<GenerateMealPlanCommand>({
    defaultValues: {
      peopleCount: 2,
      daysCount: 7,
      cuisine: "Polska",
      mealsToPlan: ["śniadanie", "obiad"],
      excludedIngredients: [],
      calorieTargets: [
        { person: 1, calories: 2000 },
        { person: 2, calories: 2000 },
      ],
      ...defaultValues,
    },
  });

  return <PlanGenerationForm form={form} onSubmit={onSubmit} isLoading={isLoading} />;
}

describe("PlanGenerationForm", () => {
  describe("Rendering", () => {
    it("renders all form fields", () => {
      const mockSubmit = vi.fn();
      render(<TestWrapper onSubmit={mockSubmit} />);

      // Check for main input fields
      expect(screen.getByLabelText(/liczba osób/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/liczba dni/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kuchnia/i)).toBeInTheDocument();

      // Check for meal checkboxes
      expect(screen.getByLabelText(/śniadanie/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/obiad/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kolacja/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/przekąska/i)).toBeInTheDocument();

      // Check for excluded ingredients section
      expect(screen.getByPlaceholderText(/dodaj składnik/i)).toBeInTheDocument();

      // Check for submit button
      expect(screen.getByRole("button", { name: /generuj plan posiłków/i })).toBeInTheDocument();
    });

    it("renders calorie targets for each person", () => {
      const mockSubmit = vi.fn();
      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            peopleCount: 3,
            calorieTargets: [
              { person: 1, calories: 2000 },
              { person: 2, calories: 2200 },
              { person: 3, calories: 1800 },
            ],
          }}
        />
      );

      expect(screen.getByLabelText(/osoba 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/osoba 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/osoba 3/i)).toBeInTheDocument();
    });

    it("displays loading state on submit button when isLoading is true", () => {
      const mockSubmit = vi.fn();
      render(<TestWrapper onSubmit={mockSubmit} isLoading={true} />);

      const submitButton = screen.getByRole("button", { name: /generowanie/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Generowanie...");
    });

    it("renders all cuisine options", () => {
      const mockSubmit = vi.fn();
      render(<TestWrapper onSubmit={mockSubmit} />);

      const cuisineSelect = screen.getByLabelText(/kuchnia/i) as HTMLSelectElement;
      const options = Array.from(cuisineSelect.options).map((opt) => opt.value);

      expect(options).toContain("Polska");
      expect(options).toContain("Włoska");
      expect(options).toContain("Francuska");
      expect(options).toContain("Japońska");
      expect(options).toContain("Meksykańska");
      expect(options).toContain("Indyjska");
      expect(options).toContain("Tajska");
      expect(options).toContain("Śródziemnomorska");
      expect(options).toContain("Amerykańska");
    });
  });

  describe("Meal Toggle Functionality", () => {
    it("toggles meal selection when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            mealsToPlan: ["śniadanie"],
          }}
        />
      );

      const kolacjaCheckbox = screen.getByLabelText(/kolacja/i);
      expect(kolacjaCheckbox).not.toBeChecked();

      // Add kolacja
      await user.click(kolacjaCheckbox);
      await waitFor(() => {
        expect(kolacjaCheckbox).toBeChecked();
      });

      // Remove śniadanie
      const sniadanieCheckbox = screen.getByLabelText(/śniadanie/i);
      expect(sniadanieCheckbox).toBeChecked();

      await user.click(sniadanieCheckbox);
      await waitFor(() => {
        expect(sniadanieCheckbox).not.toBeChecked();
      });
    });

    it("allows selecting multiple meals", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            mealsToPlan: [],
          }}
        />
      );

      const sniadanieCheckbox = screen.getByLabelText(/śniadanie/i);
      const obiadCheckbox = screen.getByLabelText(/obiad/i);
      const kolacjaCheckbox = screen.getByLabelText(/kolacja/i);

      await user.click(sniadanieCheckbox);
      await user.click(obiadCheckbox);
      await user.click(kolacjaCheckbox);

      await waitFor(() => {
        expect(sniadanieCheckbox).toBeChecked();
        expect(obiadCheckbox).toBeChecked();
        expect(kolacjaCheckbox).toBeChecked();
      });
    });

    it("correctly reflects initial mealsToPlan state", () => {
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            mealsToPlan: ["śniadanie", "kolacja"],
          }}
        />
      );

      expect(screen.getByLabelText(/śniadanie/i)).toBeChecked();
      expect(screen.getByLabelText(/obiad/i)).not.toBeChecked();
      expect(screen.getByLabelText(/kolacja/i)).toBeChecked();
      expect(screen.getByLabelText(/przekąska/i)).not.toBeChecked();
    });
  });

  describe("Excluded Ingredients Functionality", () => {
    it('adds ingredient when clicking "Dodaj" button', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i);
      const addButton = screen.getByRole("button", { name: /dodaj/i });

      await user.type(input, "Mleko");
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Mleko")).toBeInTheDocument();
      });
    });

    it("adds ingredient when pressing Enter key", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i);

      await user.type(input, "Orzech");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Orzech")).toBeInTheDocument();
      });
    });

    it("trims whitespace from ingredient before adding", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i);
      const addButton = screen.getByRole("button", { name: /dodaj/i });

      await user.type(input, "  Cebula  ");
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Cebula")).toBeInTheDocument();
      });
    });

    it("does not add empty or whitespace-only ingredients", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i);
      const addButton = screen.getByRole("button", { name: /dodaj/i });

      // Try to add empty string
      await user.click(addButton);

      // Try to add whitespace only
      await user.type(input, "   ");
      await user.click(addButton);

      // No ingredients should be visible
      const ingredientContainer = screen.queryByText(/usuń/i);
      expect(ingredientContainer).not.toBeInTheDocument();
    });

    it("clears input field after adding ingredient", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /dodaj/i });

      await user.type(input, "Gluten");
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("removes ingredient when clicking remove button", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            excludedIngredients: ["Mleko", "Jajka", "Gluten"],
          }}
        />
      );

      expect(screen.getByText("Mleko")).toBeInTheDocument();
      expect(screen.getByText("Jajka")).toBeInTheDocument();
      expect(screen.getByText("Gluten")).toBeInTheDocument();

      // Remove middle ingredient
      const removeButtons = screen.getAllByRole("button", { name: /usuń/i });
      await user.click(removeButtons[1]); // Remove "Jajka"

      await waitFor(() => {
        expect(screen.getByText("Mleko")).toBeInTheDocument();
        expect(screen.queryByText("Jajka")).not.toBeInTheDocument();
        expect(screen.getByText("Gluten")).toBeInTheDocument();
      });
    });

    it("adds multiple ingredients in sequence", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} />);

      const input = screen.getByPlaceholderText(/dodaj składnik/i);
      const addButton = screen.getByRole("button", { name: /dodaj/i });

      // Add first ingredient
      await user.type(input, "Mleko");
      await user.click(addButton);

      // Add second ingredient
      await user.type(input, "Soja");
      await user.click(addButton);

      // Add third ingredient
      await user.type(input, "Orzech");
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Mleko")).toBeInTheDocument();
        expect(screen.getByText("Soja")).toBeInTheDocument();
        expect(screen.getByText("Orzech")).toBeInTheDocument();
      });
    });

    it("displays excluded ingredients with correct accessibility labels", async () => {
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            excludedIngredients: ["Mleko", "Gluten"],
          }}
        />
      );

      expect(screen.getByRole("button", { name: /usuń mleko/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuń gluten/i })).toBeInTheDocument();
    });
  });

  describe("Calorie Targets Update (useEffect)", () => {
    it("updates calorie targets when people count increases", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            peopleCount: 2,
            calorieTargets: [
              { person: 1, calories: 2000 },
              { person: 2, calories: 2200 },
            ],
          }}
        />
      );

      // Initially 2 people
      expect(screen.getByLabelText(/osoba 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/osoba 2/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/osoba 3/i)).not.toBeInTheDocument();

      // Change to 3 people
      const peopleInput = screen.getByLabelText(/liczba osób/i);
      await user.clear(peopleInput);
      await user.type(peopleInput, "3");

      await waitFor(() => {
        expect(screen.getByLabelText(/osoba 1/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/osoba 2/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/osoba 3/i)).toBeInTheDocument();
      });
    });

    it("preserves existing calorie values when increasing people count", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            peopleCount: 2,
            calorieTargets: [
              { person: 1, calories: 1800 },
              { person: 2, calories: 2200 },
            ],
          }}
        />
      );

      const person1Input = screen.getByLabelText(/osoba 1/i) as HTMLInputElement;
      const person2Input = screen.getByLabelText(/osoba 2/i) as HTMLInputElement;

      expect(person1Input.value).toBe("1800");
      expect(person2Input.value).toBe("2200");

      // Increase to 3 people
      const peopleInput = screen.getByLabelText(/liczba osób/i);
      await user.clear(peopleInput);
      await user.type(peopleInput, "3");

      await waitFor(() => {
        const updatedPerson1Input = screen.getByLabelText(/osoba 1/i) as HTMLInputElement;
        const updatedPerson2Input = screen.getByLabelText(/osoba 2/i) as HTMLInputElement;
        const person3Input = screen.getByLabelText(/osoba 3/i) as HTMLInputElement;

        // Original values preserved
        expect(updatedPerson1Input.value).toBe("1800");
        expect(updatedPerson2Input.value).toBe("2200");
        // New person gets default 2000
        expect(person3Input.value).toBe("2000");
      });
    });

    it("reduces calorie targets when people count decreases", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            peopleCount: 3,
            calorieTargets: [
              { person: 1, calories: 1800 },
              { person: 2, calories: 2000 },
              { person: 3, calories: 2200 },
            ],
          }}
        />
      );

      expect(screen.getByLabelText(/osoba 3/i)).toBeInTheDocument();

      // Decrease to 2 people
      const peopleInput = screen.getByLabelText(/liczba osób/i);
      await user.clear(peopleInput);
      await user.type(peopleInput, "2");

      await waitFor(() => {
        expect(screen.getByLabelText(/osoba 1/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/osoba 2/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/osoba 3/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data when submitted", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <TestWrapper
          onSubmit={mockSubmit}
          defaultValues={{
            peopleCount: 2,
            daysCount: 5,
            cuisine: "Włoska",
            mealsToPlan: ["śniadanie", "obiad"],
            excludedIngredients: ["Mleko"],
            calorieTargets: [
              { person: 1, calories: 2000 },
              { person: 2, calories: 1800 },
            ],
          }}
        />
      );

      const submitButton = screen.getByRole("button", { name: /generuj plan posiłków/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();

        // Get the first argument (form data) from the first call
        const formData = mockSubmit.mock.calls[0][0];

        expect(formData).toMatchObject({
          peopleCount: 2,
          daysCount: 5,
          cuisine: "Włoska",
          mealsToPlan: ["śniadanie", "obiad"],
          excludedIngredients: ["Mleko"],
          calorieTargets: [
            { person: 1, calories: 2000 },
            { person: 2, calories: 1800 },
          ],
        });
      });
    });

    it("does not submit when form is loading", async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<TestWrapper onSubmit={mockSubmit} isLoading={true} />);

      const submitButton = screen.getByRole("button", { name: /generowanie/i });
      expect(submitButton).toBeDisabled();

      await user.click(submitButton);

      // Submit should not be called when button is disabled
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Form Validation and Accessibility", () => {
    it("sets aria-invalid on fields with errors", () => {
      const mockSubmit = vi.fn();

      // This would need to be tested with validation schema
      // Just checking that the aria-invalid attribute is rendered
      render(<TestWrapper onSubmit={mockSubmit} />);

      const peopleInput = screen.getByLabelText(/liczba osób/i);
      const daysInput = screen.getByLabelText(/liczba dni/i);

      // Inputs should have aria-invalid attribute (even if false)
      expect(peopleInput).toHaveAttribute("aria-invalid");
      expect(daysInput).toHaveAttribute("aria-invalid");
    });

    it("has correct input constraints", () => {
      const mockSubmit = vi.fn();
      render(<TestWrapper onSubmit={mockSubmit} />);

      const peopleInput = screen.getByLabelText(/liczba osób/i) as HTMLInputElement;
      const daysInput = screen.getByLabelText(/liczba dni/i) as HTMLInputElement;

      expect(peopleInput.type).toBe("number");
      expect(peopleInput.min).toBe("1");
      expect(peopleInput.max).toBe("20");

      expect(daysInput.type).toBe("number");
      expect(daysInput.min).toBe("1");
      expect(daysInput.max).toBe("14");
    });
  });
});
