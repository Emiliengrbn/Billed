/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should add a document with no allowed extension", () => {
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

      const onNavigate = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      window.alert = jest.fn();
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);

      fireEvent.change(file, {
        target: {
          files: [new File(["file.pdf"], "file.pdf", { type: "file/pdf" })],
        },
      });

      jest.spyOn(window, "alert");
      expect(alert).toHaveBeenCalled();
    });

    test("Then it should submit the form", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

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
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
    });

    describe("When i submit the form", () => {
      test("handleChangeFile calls store.bills().create", async () => {
        document.body.innerHTML = NewBillUI();

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );

        const createSpy = jest.spyOn(mockStore.bills(), "create");

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [
              new File(["image.png"], "image.png", { type: "image/png" }),
            ],
          },
        });

        await newBill.handleChangeFile;

        expect(createSpy).toHaveBeenCalledWith({
          data: expect.any(FormData),
          headers: {
            noContentType: true,
          },
        });
      });
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getAllByText("Envoyer une note de frais"));
      const noteDeFrais = await screen.getAllByText(
        "Envoyer une note de frais"
      );
      expect(noteDeFrais).toBeTruthy();
    });
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      console.log(document.body.innerHTML);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      // const message = await screen.getByText(/Erreur 500/);
      expect(console.error).toHaveBeenCalledWith(new Error("Erreur 500"));
    });
  });
});
