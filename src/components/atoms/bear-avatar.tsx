import { Avatar } from "@chakra-ui/react";
import { createAvatar } from "@dicebear/core";
import { adventurerNeutral, funEmoji } from "@dicebear/collection";

const BearAvatar = ({ did }: { did: string }) => {
  // Generate the avatar URL based on the user's DID
  const avatarSvg = createAvatar(funEmoji, {
    seed: did,
    flip: true,
    radius: 50,
    backgroundType: ["gradientLinear", "solid"],
  });

  return (
    <div>
      <Avatar
        mr={2}
        height={"30px"}
        width={"30px"}
        src={avatarSvg.toDataUri()}
      />
    </div>
  );
};

export default BearAvatar;
