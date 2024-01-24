/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const noteDeFrais = await screen.getByText("Mes notes de frais");
      expect(noteDeFrais).toBeTruthy();
      // const tableTitleType = await screen.getAllByText("Type");
      // expect(tableTitleType).toBeTruthy();
    });

    describe("When i click on the NewBill button", () => {
      test("Then i redirected to the correct page", () => {
        // Given
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const onNavigate = jest.fn();

        const bills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        // When
        bills.handleClickNewBill();

        // Then
        expect(bills.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
      });
    });

    describe("When I click on Eye icon", () => {
      test("Then HandleClickIconEye is called", () => {
        // connect as employee
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });

        const icon = screen.getAllByTestId("icon-eye");

        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });

        billsContainer.handleClickIconEye = jest.fn();

        window.$.fn.modal = jest.fn();

        icon[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(billsContainer.handleClickIconEye).toHaveBeenCalledWith(icon[0]);
      });

      test("Then a modal is open", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });

        const icon = screen.getAllByTestId("icon-eye");

        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });

        window.$.fn.modal = jest.fn();
        billsContainer.handleClickIconEye(icon[0]);

        expect(window.$.fn.modal).toHaveBeenCalledWith("show");
      });
    });
  });
});
