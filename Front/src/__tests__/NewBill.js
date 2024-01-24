/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should add a document with jpg, jpeg or png extension", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const allowedExtensions = ["image/png", "image/jpeg", "image/jpg"];
      const fileInput = screen.getByTestId("file");

      // SIMULE UN EVENT CHANGE
      fireEvent.change(fileInput, {
        target: {
          files: [new File([""], "image.png", { type: "image/png" })],
        },
      });
      expect(allowedExtensions).toContain(fileInput.files[0].type);
    });
  });
});
