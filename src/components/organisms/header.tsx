import { Box, Button } from "@chakra-ui/react";
import NavGroup from "../molecules/nav-group";
import { useMemo, useState } from "react";
import BearAvatar from "../atoms/bear-avatar";
import { shortenAddress } from "../../utils";
import { useAccount } from "wagmi";
import ProfileDialog from "../molecules/profile-dialog";
import { useEthContext } from "@/evm/EthContext";

const Header = ({ className }: { className?: string }) => {
  const [segment, setSegments] = useState<number>(0);
  const { address } = useAccount();
  const { toggleAccountModal } = useEthContext();
  // const navs = useMemo(
  //   () => [
  //     {
  //       title: "Feed",
  //       value: "feed",
  //       href: "/",
  //       isActive: segment === 0,
  //     },
  //     {
  //       title: "Proposals",
  //       value: "proposals",
  //       href: "/proposals",
  //       isActive: segment === 1,
  //     },
  //     {
  //       title: "Docs",
  //       value: "docs",
  //       href: "/documentation",
  //       isActive: segment === 2,
  //     },
  //   ],
  //   [segment]
  // );

  return (
    <div
      className={` flex justify-between items-center px-4 min-h-[70px] bg-transparent pr-8 ${className}`}
    >
      <Box display={["none", "none", "block"]}>
        <a className="flex space-x-2 text-md" target="_blank" href="#">
          <img
            className="mt-5 rounded-full opacity-100"
            alt="zercom-logo"
            src={"/vercel.svg"}
            style={{
              width: "auto",
              height: "60px",
            }}
          />
        </a>
      </Box>

      {/* <NavGroup navs={navs} /> */}

      {address && (
        <Button
          color="gray"
          variant="outline"
          className="w-fit px-3  py-5 cursor-pointer"
          onClick={toggleAccountModal}
        >
          {address && (
            <Box>
              <BearAvatar did={address ?? ""} />
            </Box>
          )}
          {shortenAddress(address)}
        </Button>
      )}

      <ProfileDialog />
    </div>
  );
};

export default Header;
