import React, { useEffect, useState } from "react";

import firebase, { firestore } from "firebase/app";
import { useDispatch, useSelector } from "react-redux";

import Loader from "../components/loader/Loader";
import { auth } from "../services/firebase/client";
import { RootState } from "../store";
import { categorizedKey } from "../store/pokemonsSlice";
import { setUser, clearUser, getUserDoc, UserState } from "../store/userSlice";
import { AppTemplate } from "./AppTemplate";
import { AuthTemplate } from "./AuthTemplate";

export const AuthContext = React.createContext<undefined>(undefined);

const mightRegist = async (
  uid: firebase.User["uid"]
): Promise<firestore.DocumentSnapshot<UserState["user"]>> => {
  const userDoc = getUserDoc(uid);
  const snapshot = await userDoc.get();

  if (snapshot.exists) {
    return snapshot;
  }

  const timestamp = firestore.FieldValue.serverTimestamp();
  const pokemons = Object.fromEntries(
    categorizedKey.map((key) => [key, {}])
  ) as Required<UserState>["user"]["pokemons"];
  await userDoc.set({
    userId: uid,
    pokemons,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return userDoc.get();
};

export const AuthGuard: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (nextUser) => {
      setIsLoading(false);

      if (nextUser) {
        const snapshot = await mightRegist(nextUser.uid);
        const user = snapshot.data();

        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return (
    <>
      {user ? <AppTemplate>{children}</AppTemplate> : <AuthTemplate />}
      <Loader isLoading={isLoading} />
    </>
  );
};
