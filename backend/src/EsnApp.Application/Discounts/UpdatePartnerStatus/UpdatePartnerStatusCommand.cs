using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.UpdatePartnerStatus;

public record UpdatePartnerStatusCommand(Guid Id, PartnerStatus Status)
    : IRequest<Result<PartnerDto>>;
