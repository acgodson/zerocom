"use client";
import { useEffect, useState } from "react";
import {
  DashboardWrapper,
  LayoutContent,
  LayoutFooter,
} from "../../components/template/dashboard-wrapper";

import Overview from "../../components/organisms/overview";
import NewAgent from "../../components/organisms/new-agent";

function Dashboard() {
  const [principal, setPrincipal] = useState<null | string>(null);
  const [onboard, setOnboard] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(false);
  const toggleHome = () => setTabIndex(!tabIndex);

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
    </>
  );
}

export default Dashboard;
