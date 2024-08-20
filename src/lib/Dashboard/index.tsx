"use client";
import { useEffect, useState } from "react";
import {
  DashboardWrapper,
  LayoutContent,
  LayoutFooter,
} from "../../components/template/dashboard-wrapper";

import Overview from "../../components/organisms/overview";
import NewAgent from "../../components/organisms/new-agent";
import SignUp from "@/components/organisms/signup";
import { useDBManager } from "@/rpc";
import { usePrivy } from "@privy-io/react-auth";

function Dashboard() {
  const { user } = usePrivy();
  const [principal, setPrincipal] = useState<null | string>(null);
  const [onboard, setOnboard] = useState(false);
  const [myAgent, setMyAgent] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(false);
  const toggleHome = () => setTabIndex(!tabIndex);
  const actor = useDBManager();

  async function checkProfile() {
    const Controller_Address = process.env
      .NEXT_PUBLIC_CONTROLLER_ADDRESS as `0x${string}`;
    if (!Controller_Address) {
      return;
    }
    try {
      const x = await actor.init(Controller_Address);
      if (x && x !== "0x0000000000000000000000000000000000000000") {
        setOnboard(false);
      } else {
        setOnboard(true);
      }
      setMyAgent("");
    } catch (e: any) {
      console.log("found this error", e.message);
    }
  }

  useEffect(() => {
    if (user && !myAgent && !onboard) {
      checkProfile();
    }
  }, [user, myAgent, onboard]);

  return (
    <>
      <DashboardWrapper>
        <LayoutContent>
          {tabIndex ? (
            <Overview toggleHome={toggleHome} />
          ) : (
            <NewAgent toggleHome={toggleHome} />
          )}
        </LayoutContent>

        {tabIndex && (
          <LayoutFooter>
            <p>&copy; 2024 Zero Community</p>
          </LayoutFooter>
        )}
      </DashboardWrapper>

      <SignUp isOpen={onboard} toggleSignup={() => setOnboard(!onboard)} />
    </>
  );
}

export default Dashboard;
