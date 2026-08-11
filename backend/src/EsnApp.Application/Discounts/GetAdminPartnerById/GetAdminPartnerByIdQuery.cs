using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartnerById;

public record GetAdminPartnerByIdQuery(Guid Id) : IRequest<Result<PartnerDto>>;
