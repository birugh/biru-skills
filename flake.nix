{
  description = "biru-skills: dev shell + checks";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    pi.url = "github:earendil-works/pi/stable";
  };

  outputs = { self, nixpkgs, pi }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor = system: import nixpkgs { inherit system; };
      pyEnv = pkgs: pkgs.python3.withPackages (ps: [ ps.pyyaml ]);
    in
    {
      devShells = forAllSystems (system:
        let pkgs = pkgsFor system; in
        {
          default = pkgs.mkShell {
            packages = [
              (pyEnv pkgs)
              pkgs.nodejs_24
              pi.packages.${system}.default
            ];
          };
        });

      checks = forAllSystems (system:
        let pkgs = pkgsFor system; in
        {
          validate-skills = pkgs.runCommand "validate-skills"
            { src = self; nativeBuildInputs = [ (pyEnv pkgs) ]; }
            ''
              cp -r "$src" source
              chmod -R +w source
              cd source
              python3 scripts/validate-skills.py
              touch "$out"
            '';
        });
    };
}
