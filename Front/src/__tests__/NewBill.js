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
  describe("When an error 500 occurs on API", () => {
    beforeEach(() => {
      // Configuration de l'environnement de test
      document.body.innerHTML = "";
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
      document.body.append(root);
      router();
    });
    afterEach(() => {
      // Réinitialisation de l'environnement de test
      document.body.innerHTML = NewBillUI();
      jest.restoreAllMocks();
      const root = document.getElementById("root");
      if (root) {
        document.body.removeChild(root);
      }
    });
    // Tests pour la gestion d'une erreur de l'API
    describe("Given a failed attempt to post bills to the API with a 500 error", () => {
      beforeEach(() => {
        // Espionne la méthode "bills" de l'objet mockStore
        jest.spyOn(mockStore, "bills");

        // Remplace l'objet localStorage par un objet de mock
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        // Initialise l'utilisateur en tant qu'employé connecté
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        // Crée un élément de div en tant que point d'ancrage pour l'application
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        // Initialise le router
        router();
      });
      test("Then displays an error message on 500 response", async () => {
        // Création d'une erreur simulée
        const mockError = new Error("Erreur 500");
        console.error = jest.fn();
        // Navigation vers la page NewBill
        window.onNavigate(ROUTES_PATH.NewBill);
        // Mock de la méthode 'update' de bills
        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: jest.fn().mockRejectedValueOnce(mockError),
          };
        });
        // Initialisation de l'instance NewBill
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Soumission du formulaire
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => {
          e.preventDefault();
          try {
            newBill.updateBill(newBill);
          } catch (error) {
            console.error(error);
          }
        });
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        // Assertions sur la soumission du formulaire
        expect(handleSubmit).toHaveBeenCalled();
        // Attente de l'affichage de l'erreur
        await waitFor(() =>
          expect(console.error).toHaveBeenCalledWith(mockError)
        );
      });
    });
  });
});
