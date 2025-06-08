// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleTokenFactory {
    address public owner;
    address public feeReceiver;
    uint256 public baseFee = 0.002 ether;
    uint256 public featurePrice = 0.001 ether;
    
    address[] public deployedTokens;
    mapping(address => address[]) public userTokens;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 paidAmount
    );
    
    event PaymentReceived(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    event PaymentTransferred(
        address indexed to,
        uint256 amount,
        bool success
    );
    
    constructor(address _feeReceiver) {
        require(_feeReceiver != address(0), "Fee receiver cannot be zero address");
        owner = msg.sender;
        feeReceiver = _feeReceiver;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool[] memory features
    ) external payable returns (address) {
        // Calculate price based on features
        uint256 price = calculatePrice(features);
        require(msg.value >= price, "Insufficient payment");
        
        // Emitir evento de pago recibido
        emit PaymentReceived(msg.sender, address(this), msg.value);
        
        // CRÍTICO: Transferir el pago INMEDIATAMENTE al fee receiver
        uint256 amountToTransfer = msg.value;
        
        // Usar call para transferir ETH con verificación detallada
        (bool sent, bytes memory data) = feeReceiver.call{value: amountToTransfer}("");
        
        // Emitir evento de transferencia para debugging
        emit PaymentTransferred(feeReceiver, amountToTransfer, sent);
        
        // Si la transferencia falla, revertir toda la transacción
        require(sent, string(abi.encodePacked("Payment transfer failed. Data: ", data)));
        
        // Solo después de transferir exitosamente, crear el token
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            totalSupply,
            decimals,
            features,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        // Record deployment
        deployedTokens.push(tokenAddress);
        userTokens[msg.sender].push(tokenAddress);
        
        // Emit event
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            totalSupply,
            amountToTransfer
        );
        
        return tokenAddress;
    }
    
    function calculatePrice(bool[] memory features) public view returns (uint256) {
        uint256 price = baseFee;
        
        // Count active features
        for (uint i = 0; i < features.length; i++) {
            if (features[i]) {
                price += featurePrice;
            }
        }
        
        return price;
    }
    
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
    
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }
    
    // Función para verificar el balance del contrato
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Función de emergencia para retirar fondos atascados (SOLO PARA DEBUGGING)
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner");
        require(address(this).balance > 0, "No funds to withdraw");
        
        uint256 amount = address(this).balance;
        
        // Transferir al fee receiver, no al owner
        (bool sent, ) = feeReceiver.call{value: amount}("");
        require(sent, "Emergency withdrawal failed");
        
        emit PaymentTransferred(feeReceiver, amount, sent);
    }
    
    // Función para verificar si una dirección puede recibir ETH
    function testPaymentTransfer(address recipient) external payable {
        require(msg.sender == owner, "Only owner");
        require(msg.value > 0, "Must send some ETH");
        
        (bool sent, bytes memory data) = recipient.call{value: msg.value}("");
        emit PaymentTransferred(recipient, msg.value, sent);
        
        if (!sent) {
            // Si falla, devolver el ETH al sender
            (bool refunded, ) = msg.sender.call{value: msg.value}("");
            require(refunded, "Refund failed");
        }
    }
    
    // Admin functions
    function updateFeeReceiver(address _feeReceiver) external {
        require(msg.sender == owner, "Only owner");
        require(_feeReceiver != address(0), "Fee receiver cannot be zero address");
        
        address oldReceiver = feeReceiver;
        feeReceiver = _feeReceiver;
        
        // Emitir evento para tracking
        emit PaymentTransferred(oldReceiver, 0, false); // Indicar cambio
        emit PaymentTransferred(_feeReceiver, 0, true);  // Nueva dirección
    }
    
    function updatePrices(uint256 _baseFee, uint256 _featurePrice) external {
        require(msg.sender == owner, "Only owner");
        baseFee = _baseFee;
        featurePrice = _featurePrice;
    }
    
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // Función para recibir ETH directamente (fallback)
    receive() external payable {
        emit PaymentReceived(msg.sender, address(this), msg.value);
        
        // Transferir inmediatamente al fee receiver
        if (msg.value > 0) {
            (bool sent, ) = feeReceiver.call{value: msg.value}("");
            emit PaymentTransferred(feeReceiver, msg.value, sent);
        }
    }
    
    // Fallback function
    fallback() external payable {
        emit PaymentReceived(msg.sender, address(this), msg.value);
        
        // Transferir inmediatamente al fee receiver
        if (msg.value > 0) {
            (bool sent, ) = feeReceiver.call{value: msg.value}("");
            emit PaymentTransferred(feeReceiver, msg.value, sent);
        }
    }
}

// Contrato de token simplificado y optimizado
contract CustomToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    
    // Features
    bool public isBurnable;
    bool public isMintable;
    bool public isPausable;
    bool public isDeflationary;
    bool public isAntiWhale;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint8 _decimals,
        bool[] memory _features,
        address _owner
    ) {
        require(_owner != address(0), "Owner cannot be zero address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(_totalSupply > 0, "Total supply must be greater than 0");
        
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * (10 ** _decimals);
        owner = _owner;
        
        // Set features with bounds checking
        if (_features.length >= 5) {
            isBurnable = _features[0];
            isMintable = _features[1];
            isPausable = _features[2];
            isDeflationary = _features[3];
            isAntiWhale = _features[4];
        }
        
        // Mint initial supply to owner
        balanceOf[_owner] = totalSupply;
        emit Transfer(address(0), _owner, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Cannot approve zero address");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(from != address(0), "Cannot transfer from zero address");
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function burn(uint256 amount) external {
        require(isBurnable, "Burning not enabled");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint");
        require(isMintable, "Minting not enabled");
        require(to != address(0), "Cannot mint to zero address");
        
        balanceOf[to] += amount;
        totalSupply += amount;
        
        emit Transfer(address(0), to, amount);
    }
}
